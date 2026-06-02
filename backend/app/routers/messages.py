from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.utils.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/chat", tags=["chat"])

@router.get("/conversations")
def get_conversations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = db.execute(text("""
        SELECT DISTINCT ON (other_user_id)
            other_user_id,
            u.full_name,
            u.profile_picture_url,
            message_text,
            pm.created_at
        FROM (
            SELECT 
                CASE WHEN sender_id = :user_id THEN receiver_id ELSE sender_id END as other_user_id,
                message_text,
                created_at
            FROM private_messages
            WHERE sender_id = :user_id OR receiver_id = :user_id
        ) pm
        JOIN users u ON u.id = pm.other_user_id
        ORDER BY other_user_id, pm.created_at DESC
    """), {'user_id': current_user.id})

    conversations = [{
        'user_id': str(row.other_user_id),
        'full_name': row.full_name,
        'profile_picture_url': row.profile_picture_url,
        'last_message': row.message_text,
        'created_at': row.created_at.isoformat()
    } for row in result]

    return conversations