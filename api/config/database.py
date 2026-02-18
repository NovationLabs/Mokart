from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()

class SupabaseConfig:
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL", "https://qqjzcohrjhcambgulhae.supabase.co")
        self.supabase_key = os.getenv("SUPABASE_KEY_SECRET")
        self.client: Client = None
        self._connect()

    def _connect(self):
        """Initialiser la connexion Supabase"""
        if self.supabase_key and self.supabase_url:
            try:
                self.client = create_client(self.supabase_url, self.supabase_key)
                print("✅ Supabase connecté")
                print(f"🔑 URL: {self.supabase_url}")
                print(f"🔑 Key type: {type(self.supabase_key)}")
                print(f"🔑 Key length: {len(self.supabase_key)}")
            except Exception as e:
                print(f"⚠️ Erreur de connexion Supabase: {e}")
                self.client = None
        else:
            print("⚠️ SUPABASE_KEY_SECRET ou SUPABASE_URL non configuré")
            self.client = None

    def get_client(self) -> Client:
        """Retourner le client Supabase"""
        return self.client

# Instance globale
supabase_config = SupabaseConfig()
supabase = supabase_config.get_client()
