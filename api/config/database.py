from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

db_user = os.getenv('DB_USER')
db_pass = os.getenv('DB_PASSWORD')
db_name = os.getenv('DB_NAME')
# Database URL format: postgresql://user:password@host:port/dbname
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"postgresql://{db_user}:{db_pass}@{os.getenv('DB_HOST', 'localhost')}:5432/{db_name}"
)

# Create the SQLAlchemy engine
engine = create_engine(DATABASE_URL)

# Create a SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Dependency to get a DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
