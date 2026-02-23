from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, BigInteger
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from config.database import Base
import uuid

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    kart = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Session(Base):
    __tablename__ = "sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    kart = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class SensorData(Base):
    __tablename__ = "sensor_data"

    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), primary_key=True)
    timestamp = Column(BigInteger, primary_key=True)
    uwb_x = Column(Float)
    uwb_y = Column(Float)
    uwb_z = Column(Float)
    imu_ax = Column(Float)
    imu_ay = Column(Float)
    imu_az = Column(Float)
    imu_gx = Column(Float)
    imu_gy = Column(Float)
    imu_gz = Column(Float)
    steering_angle = Column(Float)
