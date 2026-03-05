from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, BigInteger
from sqlalchemy.dialects.postgresql import UUID, FLOAT
from sqlalchemy.sql import func
from config.database import Base
import uuid

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    first_name = Column(String)
    last_name = Column(String)
    phone = Column(String)
    kart = Column(String)
    role = Column(String, default="pilot")  # admin, pilot, mechanic, observer
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Session(Base):
    __tablename__ = "sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    kart = Column(String)
    circuit_id = Column(UUID(as_uuid=True), ForeignKey("circuits.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class SensorData(Base):
    __tablename__ = "sensor_data"

    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), primary_key=True)
    timestamp = Column(BigInteger, primary_key=True)
    uwb_x = Column(FLOAT(precision=4))
    uwb_y = Column(FLOAT(precision=4))
    uwb_z = Column(FLOAT(precision=4))
    imu_ax = Column(FLOAT(precision=4))
    imu_ay = Column(FLOAT(precision=4))
    imu_az = Column(FLOAT(precision=4))
    imu_gx = Column(FLOAT(precision=4))
    imu_gy = Column(FLOAT(precision=4))
    imu_gz = Column(FLOAT(precision=4))
    steering_angle = Column(FLOAT(precision=4))

class Circuit(Base):
    __tablename__ = "circuits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, nullable=False)
    description = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class CircuitBoundary(Base):
    __tablename__ = "circuit_boundaries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    circuit_id = Column(UUID(as_uuid=True), ForeignKey("circuits.id"), nullable=False)
    side = Column(String, nullable=False)  # 'left' or 'right'
    point_order = Column(Integer, nullable=False)
    x = Column(FLOAT(precision=4), nullable=False)
    y = Column(FLOAT(precision=4), nullable=False)

class OptimalTrajectory(Base):
    __tablename__ = "optimal_trajectories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    circuit_id = Column(UUID(as_uuid=True), ForeignKey("circuits.id"), nullable=False)
    point_order = Column(Integer, nullable=False)
    x = Column(FLOAT(precision=4), nullable=False)
    y = Column(FLOAT(precision=4), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
