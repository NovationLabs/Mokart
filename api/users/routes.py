from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from sqlalchemy import text
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional
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

@router.get("/profile", response_model=UserProfile)
async def get_user_profile(user_id: str, db: Session = Depends(get_db)):
    """Récupérer le profil utilisateur"""
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

    # Convertir le résultat en dict et transformer l'UUID en string
    result_dict = result._asdict()
    result_dict['id'] = str(result_dict['id'])

    return UserProfile(**result_dict)

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
async def get_user_notifications(
    user_id: str,
    unread_only: bool = False,
    db: Session = Depends(get_db)
):
    """Récupérer les notifications de l'utilisateur"""
    where_clause = "WHERE user_id = :user_id"
    if unread_only:
        where_clause += " AND read = FALSE"

    query = text(f"""
    SELECT id, title, message, type, read, created_at
    FROM notifications
    {where_clause}
    ORDER BY created_at DESC
    LIMIT 50
    """)

    result = db.execute(query, {"user_id": user_id}).fetchall()

    # Convertir les UUIDs en strings
    notifications = []
    for row in result:
        row_dict = row._asdict()
        row_dict['id'] = str(row_dict['id'])
        notifications.append(Notification(**row_dict))

    return notifications

@router.put("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    user_id: str,
    db: Session = Depends(get_db)
):
    """Marquer une notification comme lue"""
    # Vérifier que la notification appartient à l'utilisateur
    check_query = text("""
    SELECT id FROM notifications
    WHERE id = :notification_id AND user_id = :user_id
    """)
    notification = db.execute(check_query, {
        "notification_id": notification_id,
        "user_id": user_id
    }).fetchone()

    if not notification:
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
async def mark_all_notifications_read(user_id: str, db: Session = Depends(get_db)):
    """Marquer toutes les notifications comme lues"""
    update_query = text("""
    UPDATE notifications
    SET read = TRUE, read_at = CURRENT_TIMESTAMP
    WHERE user_id = :user_id AND read = FALSE
    """)

    result = db.execute(update_query, {"user_id": user_id})
    db.commit()

    return {"message": f"{result.rowcount} notifications marquées comme lues"}
