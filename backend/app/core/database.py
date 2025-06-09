from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from .config import settings

# 1) Создаём Engine
engine = create_engine(
    settings.DATABASE_URL,
    echo=True,
    future=True,
)

# 2) Создаём SessionLalembic revision --autogenerate -m "add all domain tables"ocal
SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    future=True,
)

# 3) Declarative Base для моделей
Base = declarative_base()


# 4) Dependency для FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
