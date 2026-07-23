import { useEffect, useRef, useState } from 'react';

// Récupère les frames HUD d'une session (GET /sessions/{id}/hud-frames) puis les
// rejoue à `dt_s` (10 Hz par défaut). Contrat de données identique au futur flux
// live poussé par le RPi — pour passer en live, seule cette source changera
// (fetch+replay → EventSource), le HUD ne bouge pas.

// Base URL "réseau-friendly" (même logique qu'AnalysisPage.tsx) : en prod le
// build bake REACT_APP_API_URL=/api ; en dev on vise l'IP qui sert la page
// (pour qu'un téléphone sur le même réseau atteigne l'API), port 8081.
const API_BASE_URL =
  process.env.REACT_APP_API_URL || `http://${window.location.hostname}:8081`;

export interface HudFrame {
  t: number;
  speed: number;
  gx: number;
  gy: number;
  delta: number | null;
  lap: number;
  lap_time: number;
  sector: number;
  x: number;
  y: number;
}

export interface HudSession {
  session_id: string;
  kart: string | null;
  circuit_id: string | null;
  dt_s: number;
  bounds: { min_x: number; max_x: number; min_y: number; max_y: number };
  best_lap: number | null;
  track: number[][]; // tracé unique lissé [[x,y],...]
  frames: HudFrame[];
}

interface UseTelemetryFrames {
  loading: boolean;
  error: string | null;
  meta: HudSession | null;
  frame: HudFrame | null;
  index: number;
  playing: boolean;
  setPlaying: (p: boolean) => void;
  restart: () => void;
}

export function useTelemetryFrames(sessionId: string | undefined): UseTelemetryFrames {
  const [meta, setMeta] = useState<HudSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);

  // Fetch des frames
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`${API_BASE_URL}/sessions/${sessionId}/hud-frames`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: HudSession) => {
        if (cancelled) return;
        if (!data.frames || data.frames.length === 0) throw new Error('Session vide');
        setMeta(data);
        setIndex(0);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message || 'Erreur de chargement');
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  // Boucle de replay
  const metaRef = useRef<HudSession | null>(null);
  metaRef.current = meta;
  useEffect(() => {
    if (!meta || !playing) return;
    const periodMs = Math.max(20, (meta.dt_s || 0.1) * 1000);
    const id = setInterval(() => {
      setIndex((i) => {
        const total = metaRef.current?.frames.length ?? 0;
        return total > 0 ? (i + 1) % total : 0;
      });
    }, periodMs);
    return () => clearInterval(id);
  }, [meta, playing]);

  const frame = meta && meta.frames[index] ? meta.frames[index] : null;

  return {
    loading,
    error,
    meta,
    frame,
    index,
    playing,
    setPlaying,
    restart: () => setIndex(0),
  };
}
