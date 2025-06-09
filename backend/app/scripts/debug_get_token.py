from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.core.config import settings
from jose import jwt

db = SessionLocal()

# Пытаемся найти админа
admin = db.query(User).filter_by(email="admin@example.com").first()

# Если нет — создаём в базе
if not admin:
    admin = User(email="admin@example.com", role=UserRole.admin)
    db.add(admin)
    db.commit()
    db.refresh(admin)  # теперь admin.id точно есть

print(f"admin.id = {admin.id}")  # для отладки

# Генерация валидного JWT
payload = {"sub": str(admin.id)}
token = jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")

print(f"\n✅ Админ-токен:\nBearer {token}\n")
