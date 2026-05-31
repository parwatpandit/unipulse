import socketio
import redis
import json
from app.utils.auth import verify_token
from app.database import get_db
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from app.database import SessionLocal
from sqlalchemy import text
from datetime import datetime

# Redis connection
r = redis.Redis(host='localhost', port=6379, decode_responses=True)

# Socket.io server
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')

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
    
    await sio.save_session(sid, {'user_id': user['user_id'], 'email': user['email']})
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

    message = {
        'user_id': user_id,
        'email': email,
        'message': text
    }

    # Store in Redis (keep last 100 messages)
    r.lpush(GLOBAL_CHAT_KEY, json.dumps(message))
    r.ltrim(GLOBAL_CHAT_KEY, 0, MAX_MESSAGES - 1)

    # Broadcast to all connected clients
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
        db.execute(text("""
            INSERT INTO private_messages (sender_id, receiver_id, message_text, is_read, created_at)
            VALUES (:sender_id, :receiver_id, :message_text, false, :created_at)
        """), {
            'sender_id': user_id,
            'receiver_id': receiver_id,
            'message_text': message_text,
            'created_at': datetime.utcnow()
        })
        db.commit()
    finally:
        db.close()

    room = get_private_room(user_id, receiver_id)
    await sio.emit('private_message', {
        'sender_id': user_id,
        'receiver_id': receiver_id,
        'message': message_text
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
        result = db.execute(text("""
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