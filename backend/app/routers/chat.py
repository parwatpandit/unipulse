import socketio
import redis
import json
from app.utils.auth import verify_token

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