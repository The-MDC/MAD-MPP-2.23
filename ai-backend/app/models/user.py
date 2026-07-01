import uuid
from sqlalchemy import Column, Integer, String, Numeric, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    wallet_address = Column(String, unique=True, nullable=False, index=True)
    xp = Column(Integer, nullable=False, default=0)
    eigen_trust_score = Column(Numeric(5, 2), nullable=False, default=10.0)
    saver_tokens = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    def to_dict(self):
        return {
            "id": str(self.id),
            "wallet_address": self.wallet_address,
            "xp": self.xp,
            "eigen_trust_score": float(self.eigen_trust_score) if self.eigen_trust_score is not None else 10.0,
            "saver_tokens": self.saver_tokens,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
