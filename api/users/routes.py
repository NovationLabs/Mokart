from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from sqlalchemy import text
from sqlalchemy.orm import Session
from datetime import datetime, date
from typing import List, Optional, Dict
from config.database import get_db

router = APIRouter(prefix="/users", tags=["users"])

# Pydantic models
class UserProfile(BaseModel):
    id: str
    username: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class UserProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None

class Notification(BaseModel):
    id: str
    title: str
    message: str
    type: str
    read: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Admin models for user management
class User(BaseModel):
    id: str
    username: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    kart: Optional[str] = None
    role: str
    is_active: bool
    license_number: Optional[str] = None
    license_expiry: Optional[date] = None
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    kart: Optional[str] = None
    role: str
    license_number: Optional[str] = None
    license_expiry: Optional[date] = None

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    kart: Optional[str] = None
    role: Optional[str] = None
    license_number: Optional[str] = None
    license_expiry: Optional[date] = None

class UserStats(BaseModel):
    total: int
    active: int
    inactive: int
    by_role: Dict[str, int]
    new_users_this_month: int = 0

@router.get("/profile", response_model=UserProfile)
async def get_user_profile(user_id: str = "", db: Session = Depends(get_db)):
    """Récupérer le profil utilisateur"""
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilisateur non authentifié"
        )

    query = text("""
    SELECT id, username, email, first_name, last_name, phone, created_at
    FROM users
    WHERE id = :user_id
    """)
    result = db.execute(query, {"user_id": user_id}).fetchone()

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )

    return UserProfile(
        id=str(result.id),
        username=result.username,
        email=result.email,
        first_name=result.first_name,
        last_name=result.last_name,
        phone=result.phone,
        created_at=result.created_at
    )

@router.put("/profile", response_model=UserProfile)
async def update_user_profile(
    user_id: str,
    profile_update: UserProfileUpdate,
    db: Session = Depends(get_db)
):
    """Mettre à jour le profil utilisateur"""
    # Vérifier si l'utilisateur existe
    check_query = text("SELECT id FROM users WHERE id = :user_id")
    existing_user = db.execute(check_query, {"user_id": user_id}).fetchone()

    if not existing_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )

    # Construire la requête de mise à jour dynamique
    update_fields = []
    params = {"user_id": user_id}

    if profile_update.first_name is not None:
        update_fields.append("first_name = :first_name")
        params["first_name"] = profile_update.first_name

    if profile_update.last_name is not None:
        update_fields.append("last_name = :last_name")
        params["last_name"] = profile_update.last_name

    if profile_update.phone is not None:
        update_fields.append("phone = :phone")
        params["phone"] = profile_update.phone

    if profile_update.email is not None:
        update_fields.append("email = :email")
        params["email"] = profile_update.email

    if not update_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aucun champ à mettre à jour"
        )

    update_query = text("""
    UPDATE users
    SET {0}
    WHERE id = :user_id
    """.format(', '.join(update_fields)))

    db.execute(update_query, params)
    db.commit()

    # Récupérer le profil mis à jour
    return await get_user_profile(user_id, db)

@router.get("/notifications", response_model=List[Notification])
async def get_user_notifications(user_id: str = "", unread_only: bool = False, db: Session = Depends(get_db)):
    """Récupérer les notifications utilisateur"""
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilisateur non authentifié"
        )

    query = text("""
    SELECT id, title, message, type, read, created_at
    FROM notifications
    WHERE user_id = :user_id
    """)

    params = {"user_id": user_id}
    if unread_only:
        query = text("""
        SELECT id, title, message, type, read, created_at
        FROM notifications
        WHERE user_id = :user_id AND read = FALSE
        """)

    result = db.execute(query, params).fetchall()

    notifications = []
    for row in result:
        notifications.append(Notification(
            id=str(row.id),
            title=row.title,
            message=row.message,
            type=row.type,
            read=row.read,
            created_at=row.created_at
        ))

    return notifications

@router.put("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    user_id: str = "",
    db: Session = Depends(get_db)
):
    """Marquer une notification comme lue"""
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilisateur non authentifié"
        )

    # Vérifier que la notification appartient à l'utilisateur
    check_query = text("""
    SELECT id FROM notifications
    WHERE id = :notification_id AND user_id = :user_id
    """)
    result = db.execute(check_query, {
        "notification_id": notification_id,
        "user_id": user_id
    }).fetchone()

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification non trouvée"
        )

    # Marquer comme lue
    update_query = text("""
    UPDATE notifications
    SET read = TRUE, read_at = CURRENT_TIMESTAMP
    WHERE id = :notification_id
    """)
    db.execute(update_query, {"notification_id": notification_id})
    db.commit()

    return {"message": "Notification marquée comme lue"}

@router.put("/notifications/read-all")
async def mark_all_notifications_read(user_id: str = "", db: Session = Depends(get_db)):
    """Marquer toutes les notifications comme lues"""
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilisateur non authentifié"
        )

    update_query = text("""
    UPDATE notifications
    SET read = TRUE, read_at = CURRENT_TIMESTAMP
    WHERE user_id = :user_id AND read = FALSE
    """)

    result = db.execute(update_query, {"user_id": user_id})
    db.commit()

    return {"message": f"{result.rowcount} notifications marquées comme lues"}

# Admin routes for user management
admin_router = APIRouter(prefix="/admin/users", tags=["admin-users"])

@admin_router.get("/", response_model=List[User])
async def get_all_users(db: Session = Depends(get_db)):
    """Récupérer tous les utilisateurs (admin)"""
    try:
        query = text("""
        SELECT id, username, email, first_name, last_name, phone, kart,
               role, is_active, license_number, license_expiry,
               created_at, updated_at
        FROM users
        ORDER BY created_at DESC
        """)
        result = db.execute(query).fetchall()

        users = []
        for row in result:
            row_dict = row._asdict()
            row_dict['id'] = str(row_dict['id'])
            # last_login n'existe pas dans la BDD, on l'omet
            users.append(User(**row_dict))

        return users
    except Exception as e:
        print(f"Erreur SQL: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur SQL: {str(e)}"
        )

@admin_router.get("/stats", response_model=UserStats)
async def get_user_stats(db: Session = Depends(get_db)):
    """Récupérer les statistiques des utilisateurs"""
    # Stats générales
    total_query = text("SELECT COUNT(*) as count FROM users")
    total = db.execute(total_query).scalar()

    active_query = text("SELECT COUNT(*) as count FROM users WHERE is_active = TRUE")
    active = db.execute(active_query).scalar()

    inactive = total - active

    # Stats par rôle
    role_query = text("""
    SELECT role, COUNT(*) as count
    FROM users
    GROUP BY role
    """)
    role_result = db.execute(role_query).fetchall()

    by_role = {row.role: row.count for row in role_result}

    # Nouveaux utilisateurs ce mois
    new_month_query = text("""
    SELECT COUNT(*) as count
    FROM users
    WHERE created_at >= date_trunc('month', CURRENT_DATE)
    """)
    new_users_this_month = db.execute(new_month_query).scalar()

    return UserStats(
        total=total,
        active=active,
        inactive=inactive,
        by_role=by_role,
        new_users_this_month=new_users_this_month or 0
    )

@admin_router.get("/{user_id}", response_model=User)
async def get_user_by_id(user_id: str, db: Session = Depends(get_db)):
    """Récupérer un utilisateur par son ID (admin)"""
    query = text("""
    SELECT id, username, email, first_name, last_name, phone, kart,
           role, is_active, license_number, license_expiry,
           created_at, updated_at, last_login
    FROM users
    WHERE id = :user_id
    """)
    result = db.execute(query, {"user_id": user_id}).fetchone()

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )

    result_dict = result._asdict()
    result_dict['id'] = str(result_dict['id'])

    return User(**result_dict)

@admin_router.post("/", response_model=User)
async def create_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """Créer un nouvel utilisateur (admin)"""
    # Vérifier si le username ou email existe déjà
    check_query = text("""
    SELECT id FROM users
    WHERE username = :username OR email = :email
    """)
    existing = db.execute(check_query, {
        "username": user_data.username,
        "email": user_data.email
    }).fetchone()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nom d'utilisateur ou email déjà utilisé"
        )

    # Hash du mot de passe (simple pour l'instant)
    password_hash = f"hash_{user_data.password}"  # TODO: utiliser bcrypt

    # Insertion
    insert_query = text("""
    INSERT INTO users (username, email, password_hash, first_name, last_name,
                       phone, kart, role, is_active, license_number, license_expiry,
                       created_at, updated_at)
    VALUES (:username, :email, :password_hash, :first_name, :last_name,
            :phone, :kart, :role, TRUE, :license_number, :license_expiry,
            NOW(), NOW())
    RETURNING id, username, email, first_name, last_name, phone, kart,
              role, is_active, license_number, license_expiry,
              created_at, updated_at, last_login
    """)

    result = db.execute(insert_query, {
        "username": user_data.username,
        "email": user_data.email,
        "password_hash": password_hash,
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "phone": user_data.phone,
        "kart": user_data.kart,
        "role": user_data.role,
        "license_number": user_data.license_number,
        "license_expiry": user_data.license_expiry
    }).fetchone()

    db.commit()

    result_dict = result._asdict()
    result_dict['id'] = str(result_dict['id'])

    return User(**result_dict)

@admin_router.put("/{user_id}", response_model=User)
async def update_user(user_id: str, user_data: UserUpdate, db: Session = Depends(get_db)):
    """Mettre à jour un utilisateur (admin)"""
    try:
        print(f"Tentative de mise à jour utilisateur {user_id} avec données: {user_data.dict(exclude_unset=True)}")

        # Vérifier si l'utilisateur existe
        check_query = text("SELECT id FROM users WHERE id = :user_id")
        existing = db.execute(check_query, {"user_id": user_id}).fetchone()

        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Utilisateur non trouvé"
            )

        # Construire la requête de mise à jour dynamique
        update_fields = []
        params = {"user_id": user_id}

        for field, value in user_data.dict(exclude_unset=True).items():
            if value is not None:
                update_fields.append(f"{field} = :{field}")
                params[field] = value

        if not update_fields:
            # Si aucun champ à mettre à jour, retourner l'utilisateur existant
            select_query = text("""
            SELECT id, username, email, first_name, last_name, phone, kart,
                   role, is_active, license_number, license_expiry,
                   created_at, updated_at
            FROM users
            WHERE id = :user_id
            """)
            result = db.execute(select_query, {"user_id": user_id}).fetchone()
            result_dict = result._asdict()
            result_dict['id'] = str(result_dict['id'])
            return User(**result_dict)

        update_fields.append("updated_at = NOW()")

        update_query = text(f"""
        UPDATE users
        SET {', '.join(update_fields)}
        WHERE id = :user_id
        RETURNING id, username, email, first_name, last_name, phone, kart,
                  role, is_active, license_number, license_expiry,
                  created_at, updated_at
        """)

        result = db.execute(update_query, params).fetchone()
        db.commit()

        result_dict = result._asdict()
        result_dict['id'] = str(result_dict['id'])

        return User(**result_dict)
    except Exception as e:
        print(f"Erreur SQL: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur SQL: {str(e)}"
        )

@admin_router.put("/{user_id}/toggle-status")
async def toggle_user_status(user_id: str, db: Session = Depends(get_db)):
    """Activer/désactiver un utilisateur (admin)"""
    # Récupérer le statut actuel
    check_query = text("SELECT is_active FROM users WHERE id = :user_id")
    result = db.execute(check_query, {"user_id": user_id}).fetchone()

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )

    new_status = not result.is_active

    # Mise à jour
    update_query = text("""
    UPDATE users
    SET is_active = :is_active, updated_at = NOW()
    WHERE id = :user_id
    """)

    db.execute(update_query, {
        "user_id": user_id,
        "is_active": new_status
    })
    db.commit()

    return {"message": f"Utilisateur {'activé' if new_status else 'désactivé'}"}

@admin_router.delete("/{user_id}")
async def delete_user(user_id: str, db: Session = Depends(get_db)):
    """Supprimer un utilisateur (admin)"""
    # Vérifier si l'utilisateur existe
    check_query = text("SELECT id FROM users WHERE id = :user_id")
    existing = db.execute(check_query, {"user_id": user_id}).fetchone()

    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )

    # Suppression
    delete_query = text("DELETE FROM users WHERE id = :user_id")
    db.execute(delete_query, {"user_id": user_id})
    db.commit()

    return {"message": "Utilisateur supprimé"}
