from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config.database import supabase
from auth.routes import router as auth_router
from sessions.routes import router as sessions_router

app = FastAPI()

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclure les routers
app.include_router(auth_router)
app.include_router(sessions_router)

@app.get("/")
async def main():
    return {"message": "Mokart API", "status": "running", "supabase": supabase is not None}

@app.get("/health")
async def health_check():
    if supabase:
        try:
            response = supabase.table('sessions').select('*').limit(1).execute()
            return {"status": "healthy", "supabase": "connected"}
        except Exception as e:
            return {"status": "healthy", "supabase": "disconnected", "error": str(e)}
    else:
        return {"status": "healthy", "supabase": "not_configured"}
