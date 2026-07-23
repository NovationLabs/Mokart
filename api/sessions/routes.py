from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session as DbSession
from sqlalchemy import func
from config.database import get_db
from models.session import Session, SensorData, TrajectoryPoint, HudFrame, HudSession
from models import sql_models
import math
import uuid

router = APIRouter(prefix="/sessions", tags=["sessions"])


SPEED_MAX_KMH = 120.0   # au-delà = glitch GPS (kart de location ~90 km/h max)
SPEED_EMA = 0.35        # lissage exponentiel de la vitesse
TRACK_POINTS = 180      # résolution du tracé lissé renvoyé au HUD


def _resample_loop(pts, k):
    """Rééchantillonne une polyligne en k points équidistants (longueur d'arc)."""
    if len(pts) < 2:
        return [pts[0]] * k if pts else [(0.0, 0.0)] * k
    seg = [0.0]
    for i in range(1, len(pts)):
        seg.append(seg[-1] + math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]))
    total = seg[-1]
    if total == 0:
        return [pts[0]] * k
    out = []
    j = 0
    for m in range(k):
        target = total * m / k
        while j < len(seg) - 2 and seg[j + 1] < target:
            j += 1
        span = seg[j + 1] - seg[j]
        f = (target - seg[j]) / span if span > 0 else 0.0
        out.append((pts[j][0] + f * (pts[j + 1][0] - pts[j][0]),
                    pts[j][1] + f * (pts[j + 1][1] - pts[j][1])))
    return out


def _smooth_closed(loop, win=5):
    n = len(loop); h = win // 2
    return [(
        sum(loop[(i + d) % n][0] for d in range(-h, h + 1)) / win,
        sum(loop[(i + d) % n][1] for d in range(-h, h + 1)) / win,
    ) for i in range(n)]


def _build_hud_frames(rows, dt_s: float, g_scale: float):
    """Dérive les frames HUD (vitesse, G, tour, delta, secteur) à partir des
    points bruts d'une session (position + IMU).

    - position : uwb_x/uwb_y (mètres). Les trous sont comblés par la dernière valeur.
    - vitesse : distance entre positions / dt_s → km/h, avec rejet des sauts GPS
      aberrants (> SPEED_MAX_KMH) et lissage exponentiel pour une aiguille propre.
    - G : gx = latéral (imu_ay), gy = longitudinal (imu_ax).
    - tour : porte = frame la plus rapide (sur une ligne droite, franchie chaque
      tour) — même méthode robuste que rpi/build_circuit.py, insensible au point
      de départ (out-lap / paddock).
    - delta : porté de rpi/prototype_pi.py::LapManager — écart du temps courant vs
      le tour de référence à la même progression.
    """
    n = len(rows)

    # ── Passe 1 : positions comblées + vitesse (clamp glitch + lissage) ──
    px = [0.0] * n
    py = [0.0] * n
    speed = [0.0] * n
    lx = ly = None
    sm = 0.0
    for i, r in enumerate(rows):
        x = r.uwb_x if r.uwb_x is not None else (lx if lx is not None else 0.0)
        y = r.uwb_y if r.uwb_y is not None else (ly if ly is not None else 0.0)
        if lx is not None:
            raw = math.hypot(x - lx, y - ly) / dt_s * 3.6
            if raw > SPEED_MAX_KMH:        # saut GPS → garde la vitesse précédente
                raw = sm
            sm = SPEED_EMA * raw + (1 - SPEED_EMA) * sm
        px[i], py[i], speed[i] = x, y, sm
        lx, ly = x, y

    xs = [v for v in px]; ys = [v for v in py]
    bounds = {"min_x": min(xs), "max_x": max(xs), "min_y": min(ys), "max_y": max(ys)}
    diag = math.hypot(bounds["max_x"] - bounds["min_x"], bounds["max_y"] - bounds["min_y"])
    thr = diag * 0.05 if diag > 0 else 0.0

    # ── Passe 2 : porte = frame la plus rapide, détection des franchissements ──
    lap_bounds = [0]
    if thr > 0:
        gi = max(range(n), key=lambda i: speed[i])
        gx, gy = px[gi], py[gi]
        armed = True
        for i in range(n):
            d = math.hypot(px[i] - gx, py[i] - gy)
            if d > thr * 1.6:
                armed = True
            elif armed and d < thr and (i - lap_bounds[-1] > 50):
                lap_bounds.append(i); armed = False
    lap_bounds.append(n)
    # Filtre les tours trop courts (faux franchissements / out-lap)
    seg = [lap_bounds[i + 1] - lap_bounds[i] for i in range(len(lap_bounds) - 1)]
    med = sorted(seg)[len(seg) // 2] if seg else 0
    starts = [lap_bounds[0]]
    for i in range(1, len(lap_bounds) - 1):
        if lap_bounds[i] - starts[-1] >= med * 0.6:
            starts.append(lap_bounds[i])

    # frame index -> (lap number, lap_start_index)
    lap_of = [1] * n
    lap_start_of = [0] * n
    seg_frames = []            # nb de frames de chaque segment terminé (a un suivant)
    for k in range(len(starts)):
        a = starts[k]
        b = starts[k + 1] if k + 1 < len(starts) else n
        for i in range(a, b):
            lap_of[i] = k + 1
            lap_start_of[i] = a
        if k + 1 < len(starts):
            seg_frames.append(b - a)

    # Distance cumulée dans le tour courant (basée sur la vitesse lissée)
    cumdist = [0.0] * n
    acc = 0.0
    for i in range(n):
        if i > 0 and lap_start_of[i] == lap_start_of[i - 1]:
            acc += speed[i] * dt_s / 3.6
        else:
            acc = 0.0
        cumdist[i] = acc

    # Tour de référence = tour COMPLET le plus rapide (exclut l'out-lap = 1er
    # segment partiel, le kart démarre en cours de piste).
    ref_time = ref_dist = None
    completed = []
    if len(seg_frames) >= 2:
        candidates = list(range(1, len(seg_frames)))       # exclut le segment 0
        kref = min(candidates, key=lambda k: seg_frames[k])
        ref_time = seg_frames[kref] * dt_s
        ref_dist = cumdist[starts[kref + 1] - 1]
        completed = [seg_frames[k] * dt_s for k in candidates]
    elif len(seg_frames) == 1:
        ref_time = seg_frames[0] * dt_s
        ref_dist = cumdist[starts[1] - 1]
        completed = [ref_time]
    best_lap = round(min(completed), 3) if completed else None

    # ── Passe 3 : frames — delta basé sur la progression en DISTANCE ──
    # (delta = temps écoulé dans le tour − temps du tour de référence à la même
    #  position sur la piste ; porté de LapManager.live_delta mais indexé distance)
    frames = []
    for i, r in enumerate(rows):
        lap_time = (i - lap_start_of[i]) * dt_s
        pp = min(cumdist[i] / ref_dist, 1.0) if (ref_dist and ref_dist > 0) else 0.0
        delta = round(lap_time - ref_time * pp, 3) if (ref_time and lap_of[i] > 1) else None
        sector = min(3, int(min(pp, 0.999) * 3) + 1)
        frames.append(HudFrame(
            t=round(i * dt_s, 3),
            speed=round(speed[i], 1),
            gx=round((r.imu_ay or 0.0) * g_scale, 3),
            gy=round((r.imu_ax or 0.0) * g_scale, 3),
            delta=delta,
            lap=lap_of[i],
            lap_time=round(lap_time, 3),
            sector=sector,
            x=round(px[i], 3),
            y=round(py[i], 3),
        ))

    # ── Tracé unique lissé : moyenne des tours COMPLETS (exclut out-lap + tail) ──
    full_segments = [(starts[k], starts[k + 1]) for k in range(1, len(starts) - 1)]
    if full_segments:
        loops = [_resample_loop([(px[i], py[i]) for i in range(a, b + 1)], TRACK_POINTS)
                 for a, b in full_segments]
        avg = [(sum(l[m][0] for l in loops) / len(loops),
                sum(l[m][1] for l in loops) / len(loops)) for m in range(TRACK_POINTS)]
        track = [[round(x, 2), round(y, 2)] for x, y in _smooth_closed(avg, 5)]
    else:
        loop = _resample_loop([(px[i], py[i]) for i in range(n)], TRACK_POINTS)
        track = [[round(x, 2), round(y, 2)] for x, y in loop]

    # Cadre serré sur le tracé propre (plutôt que sur les errances de l'out-lap)
    if track:
        txs = [p[0] for p in track]; tys = [p[1] for p in track]
        bounds = {"min_x": min(txs), "max_x": max(txs), "min_y": min(tys), "max_y": max(tys)}

    return frames, best_lap, bounds, track

@router.get("/", response_model=list[Session])
async def get_sessions(db: DbSession = Depends(get_db)):
    """Récupérer toutes les sessions"""
    try:
        sessions = db.query(sql_models.Session).all()

        # Convertir les objets SQLAlchemy en dictionnaires puis en modèles Pydantic
        session_list = []
        for session in sessions:
            session_dict = {
                "id": str(session.id),
                "user_id": str(session.user_id) if session.user_id else None,
                "kart": session.kart,
                "circuit_id": str(session.circuit_id) if session.circuit_id else None,
                "created_at": session.created_at.isoformat() if session.created_at else None
            }
            session_list.append(Session(**session_dict))

        return session_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur interne: {str(e)}")

@router.get("/{session_id}/stats")
async def get_session_stats(session_id: str, db: DbSession = Depends(get_db), limit: int = 10000):
    """Récupérer les statistiques d'une session"""
    try:
        # Récupérer les points de la session avec une limite pour éviter les blocages
        data = db.query(sql_models.SensorData)\
            .filter(sql_models.SensorData.session_id == session_id)\
            .order_by(sql_models.SensorData.timestamp)\
            .limit(limit)\
            .all()

        if not data:
            raise HTTPException(status_code=404, detail="Session non trouvée")

        # Calculer les statistiques
        # Note: data contient des objets SQLAlchemy, on accède par attributs .nom

        # Filtres pour les caluls
        uwb_points = [d.uwb_x for d in data if d.uwb_x is not None]
        uwb_y_points = [d.uwb_y for d in data if d.uwb_y is not None]

        stats = {
            "session_id": session_id,
            "total_points": len(data),
            "duration_ms": data[-1].timestamp - data[0].timestamp if len(data) > 1 else 0,
            "limited": len(data) == limit,  # Indique si les données sont limitées

            # Pourcentages de couverture (champs non null)
            "uwb_coverage": len([d for d in data if d.uwb_x is not None]) / len(data) * 100,
            "imu_coverage": len([d for d in data if d.imu_ax is not None]) / len(data) * 100,
            "steering_coverage": len([d for d in data if d.steering_angle is not None]) / len(data) * 100,

            "bounds": {
                "min_x": min(uwb_points) if uwb_points else 0,
                "max_x": max(uwb_points) if uwb_points else 0,
                "min_y": min(uwb_y_points) if uwb_y_points else 0,
                "max_y": max(uwb_y_points) if uwb_y_points else 0
            }
        }

        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur interne: {str(e)}")

@router.get("/{session_id}/trajectory", response_model=list[TrajectoryPoint])
async def get_session_trajectory(session_id: str, db: DbSession = Depends(get_db)):
    """Récupérer la trajectoire d'une session"""
    try:
        # Récupérer les données UWB de la session
        # On ne sélectionne que les colonnes nécessaires
        query = db.query(
            sql_models.SensorData.timestamp,
            sql_models.SensorData.uwb_x,
            sql_models.SensorData.uwb_y,
            sql_models.SensorData.steering_angle
        ).filter(
            sql_models.SensorData.session_id == session_id
        ).order_by(sql_models.SensorData.timestamp)

        results = query.all()

        if not results:
            raise HTTPException(status_code=404, detail="Session non trouvée")

        # Filtrer et convertir
        trajectory = []
        for point in results:
            # point est un Row/Tuple nommé ici
            if point.uwb_x is not None and point.uwb_y is not None:
                trajectory.append(TrajectoryPoint(
                    x=point.uwb_x,
                    y=point.uwb_y,
                    timestamp=point.timestamp,
                    steering_angle=point.steering_angle
                ))

        return trajectory
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur interne: {str(e)}")

@router.get("/{session_id}/hud-frames", response_model=HudSession)
async def get_session_hud_frames(
    session_id: str,
    db: DbSession = Depends(get_db),
    dt_s: float = 0.1,
    g_scale: float = 1.0,
    limit: int = 20000,
):
    """Frames HUD prêtes à afficher pour le HUD téléphone (replay d'une session).

    Le téléphone récupère ce tableau une fois puis le rejoue à `dt_s` (10 Hz par
    défaut). Voir app/src/pages/HudPage.tsx. `g_scale` permet de convertir l'IMU
    en g si les données brutes sont en m/s² (passer ~0.102).
    """
    try:
        rows = db.query(sql_models.SensorData)\
            .filter(sql_models.SensorData.session_id == session_id)\
            .order_by(sql_models.SensorData.timestamp)\
            .limit(limit)\
            .all()

        if not rows:
            raise HTTPException(status_code=404, detail="Session non trouvée")

        session = db.query(sql_models.Session).filter(sql_models.Session.id == session_id).first()

        frames, best_lap, bounds, track = _build_hud_frames(rows, dt_s, g_scale)

        return HudSession(
            session_id=session_id,
            kart=session.kart if session else None,
            circuit_id=str(session.circuit_id) if session and session.circuit_id else None,
            dt_s=dt_s,
            bounds=bounds,
            best_lap=best_lap,
            track=track,
            frames=frames,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur interne: {str(e)}")

@router.post("/", response_model=Session)
async def create_session(session: Session, db: DbSession = Depends(get_db)):
    """Créer une nouvelle session"""
    try:
        session_id = None
        if session.id:
            try:
                session_id = uuid.UUID(session.id)
            except ValueError:
                session_id = uuid.uuid4()
        else:
            session_id = uuid.uuid4()

        new_session = sql_models.Session(
            id=session_id,
            user_id=uuid.UUID(session.user_id) if session.user_id else uuid.uuid4(), # Should be valid UUID
            kart=session.kart
        )

        db.add(new_session)
        db.commit()
        db.refresh(new_session)

        return new_session
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{session_id}/sensor-data", response_model=list[SensorData])
async def get_session_sensor_data(session_id: str, db: DbSession = Depends(get_db), limit: int = 5000, offset: int = 0):
    """Récupérer toutes les données de capteur d'une session avec pagination"""
    try:
        # Récupérer les données de capteur de la session avec pagination
        data = db.query(sql_models.SensorData)\
            .filter(sql_models.SensorData.session_id == session_id)\
            .order_by(sql_models.SensorData.timestamp)\
            .limit(limit)\
            .offset(offset)\
            .all()

        if not data:
            raise HTTPException(status_code=404, detail="Session non trouvée")

        # Convertir en modèles Pydantic
        sensor_data_list = []
        for d in data:
            sensor_dict = {
                "session_id": str(d.session_id),
                "timestamp": d.timestamp,
                "uwb_x": d.uwb_x,
                "uwb_y": d.uwb_y,
                "uwb_z": d.uwb_z,
                "imu_ax": d.imu_ax,
                "imu_ay": d.imu_ay,
                "imu_az": d.imu_az,
                "imu_gx": d.imu_gx,
                "imu_gy": d.imu_gy,
                "imu_gz": d.imu_gz,
                "steering_angle": d.steering_angle
            }
            sensor_data_list.append(SensorData(**sensor_dict))

        return sensor_data_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur interne: {str(e)}")

@router.post("/{session_id}/sensor-data", response_model=SensorData)
async def add_sensor_data(session_id: str, sensor_data: SensorData, db: DbSession = Depends(get_db)):
    """Ajouter des données de capteur à une session"""
    try:
        # S'assurer que le session_id correspond
        sensor_data.session_id = session_id

        # Créer l'objet SQL
        new_data = sql_models.SensorData(
            session_id=uuid.UUID(session_id),
            timestamp=sensor_data.timestamp,
            uwb_x=sensor_data.uwb_x,
            uwb_y=sensor_data.uwb_y,
            uwb_z=sensor_data.uwb_z,
            imu_ax=sensor_data.imu_ax,
            imu_ay=sensor_data.imu_ay,
            imu_az=sensor_data.imu_az,
            imu_gx=sensor_data.imu_gx,
            imu_gy=sensor_data.imu_gy,
            imu_gz=sensor_data.imu_gz,
            steering_angle=sensor_data.steering_angle
        )

        db.add(new_data)
        db.commit()
        db.refresh(new_data)

        return new_data
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
