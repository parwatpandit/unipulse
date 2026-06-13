import socketio
import redis
import json
from app.utils.auth import verify_token
from app.database import get_db
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from app.database import SessionLocal
from sqlalchemy import text as sql_text
from datetime import datetime

# Redis connection
import os
redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379')
r = redis.from_url(redis_url, decode_responses=True)

# Socket.io server
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*', logger=True, engineio_logger=True)

GLOBAL_CHAT_KEY = 'global_chat_messages'
MAX_MESSAGES = 100

@sio.event
async def connect(sid, environ, auth):
    token = None
    if auth and 'token' in auth:
        token = auth['token']
    
    if not token:
        return False  # Reject connection
    
    user = verify_token(token)
    if not user:
        return False  # Reject if invalid token
    
    db = SessionLocal()
    try:
        result = db.execute(sql_text("SELECT course FROM users WHERE id = :uid"), {'uid': user['user_id']})
        row = result.fetchone()
        course = row.course if row else ''
    finally:
        db.close()

    await sio.save_session(sid, {'user_id': user['user_id'], 'email': user['email'], 'course': course})
    print(f"User {user['email']} connected: {sid}")

@sio.event
async def disconnect(sid):
    session = await sio.get_session(sid)
    print(f"User {session.get('email')} disconnected: {sid}")

@sio.event
async def send_global_message(sid, data):
    session = await sio.get_session(sid)
    user_id = session.get('user_id')
    email = session.get('email')

    text = data.get('message', '').strip()
    if not text:
        return

    course = session.get('course', '')

    message = {
        'user_id': user_id,
        'email': email,
        'message': text,
        'course': course,
        'created_at': datetime.utcnow().isoformat()
    }

    r.lpush(GLOBAL_CHAT_KEY, json.dumps(message))
    r.ltrim(GLOBAL_CHAT_KEY, 0, MAX_MESSAGES - 1)

    await sio.emit('global_message', message)

@sio.event
async def get_global_history(sid):
    messages = r.lrange(GLOBAL_CHAT_KEY, 0, -1)
    history = [json.loads(m) for m in messages]
    history.reverse()  # Oldest first
    await sio.emit('global_history', history, to=sid)

def get_private_room(user1_id: str, user2_id: str) -> str:
    ids = sorted([user1_id, user2_id])
    return f"private_{ids[0]}_{ids[1]}"

@sio.event
async def join_private_room(sid, data):
    session = await sio.get_session(sid)
    user_id = session.get('user_id')
    other_user_id = data.get('other_user_id')

    if not other_user_id:
        return

    room = get_private_room(user_id, other_user_id)
    await sio.enter_room(sid, room)
    await sio.emit('joined_private_room', {'room': room}, to=sid)

@sio.event
async def send_private_message(sid, data):
    session = await sio.get_session(sid)
    user_id = session.get('user_id')
    receiver_id = data.get('receiver_id')
    message_text = data.get('message', '').strip()

    if not receiver_id or not message_text:
        return

    # Save to database
    db = SessionLocal()
    try:
        db.execute(sql_text("""
            INSERT INTO private_messages (sender_id, receiver_id, message_text, is_read, created_at)
            VALUES (:sender_id, :receiver_id, :message_text, false, :created_at)
        """), {
            'sender_id': user_id,
            'receiver_id': receiver_id,
            'message_text': message_text,
            'created_at': datetime.utcnow()
        })

        # Only notify if receiver is not already in this private room
        room = get_private_room(user_id, receiver_id)
        receiver_in_room = False
        try:
            room_sockets = sio.manager.get_participants('/', room)
            for socket_sid, _ in room_sockets:
                socket_session = await sio.get_session(socket_sid)
                if socket_session.get('user_id') == receiver_id:
                    receiver_in_room = True
                    break
        except Exception:
            receiver_in_room = False

        if not receiver_in_room:
            preview = message_text if len(message_text) <= 40 else message_text[:40] + '...'
            db.execute(sql_text("""
                INSERT INTO notifications (id, user_id, from_user_id, type, reference_id, is_read, created_at, message_preview)
                VALUES (gen_random_uuid(), :user_id, :from_user_id, 'message', :reference_id, false, :created_at, :preview)
            """), {
                'user_id': receiver_id,
                'from_user_id': user_id,
                'reference_id': user_id,
                'created_at': datetime.utcnow(),
                'preview': preview
            })

        db.commit()
    finally:
        db.close()

    room = get_private_room(user_id, receiver_id)
    await sio.emit('private_message', {
        'sender_id': user_id,
        'receiver_id': receiver_id,
        'message': message_text,
        'created_at': datetime.utcnow().isoformat()
    }, room=room)

@sio.event
async def get_private_history(sid, data):
    session = await sio.get_session(sid)
    user_id = session.get('user_id')
    other_user_id = data.get('other_user_id')

    if not other_user_id:
        return

    db = SessionLocal()
    try:
        result = db.execute(sql_text("""
            SELECT sender_id, receiver_id, message_text, created_at
            FROM private_messages
            WHERE (sender_id = :user_id AND receiver_id = :other_id)
               OR (sender_id = :other_id AND receiver_id = :user_id)
            ORDER BY created_at ASC
        """), {'user_id': user_id, 'other_id': other_user_id})
        
        messages = [{
    'sender_id': str(row.sender_id),
    'receiver_id': str(row.receiver_id),
    'message': row.message_text,
    'created_at': row.created_at.isoformat()
} for row in result]
    finally:
        db.close()

    await sio.emit('private_history', messages, to=sid)