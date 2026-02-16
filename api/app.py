from fastapi import FastAPI
from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Configuration Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://qqjzcohrjhcambgulhae.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY_SECRET")

supabase: Client = None
if SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("✅ Supabase connecté")
    except Exception as e:
        print(f"⚠️ Erreur de connexion Supabase: {e}")
else:
    print("⚠️ SUPABASE_KEY_SECRET non configuré")

@app.get("/")
async def main():
    return {"message": "Mokart API", "status": "running", "supabase": supabase is not None}

@app.get("/health")
async def health_check():
    if supabase:
        try:
            # Test de connexion à Supabase
            response = supabase.table('_test_connection').select('*').limit(1).execute()
            return {"status": "healthy", "supabase": "connected"}
        except Exception as e:
            return {"status": "healthy", "supabase": "disconnected", "error": str(e)}
    else:
        return {"status": "healthy", "supabase": "not_configured"}
