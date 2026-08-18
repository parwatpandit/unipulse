from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.routers import auth, users, posts
from app.routers import friends
from app.routers import search
from app.routers import notifications
from app.routers import live_status
from app.routers.chat import sio
from app.routers import messages
from app.routers import likes
import socketio

from fastapi import Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db

load_dotenv()

app = FastAPI(title="Unipulse API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(posts.router)
app.include_router(friends.router)
app.include_router(search.router)
app.include_router(notifications.router)
app.include_router(live_status.router)
app.include_router(messages.router)
app.include_router(likes.router)

@app.api_route("/", methods=["GET", "HEAD"])
def root():
    return {"message": "Unipulse API is running"}

@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"status": "ok"}

# Mount Socket.io
socket_app = socketio.ASGIApp(sio, app)