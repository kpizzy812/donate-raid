# backend/app/routers/admin/articles.py - ИСПРАВЛЕННАЯ ВЕРСИЯ
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.models.blog.article import Article, ArticleTag
from app.schemas.admin.articles import ArticleCreate, ArticleUpdate, ArticleRead
from app.services.auth import get_current_user
from app.models.user import User
from app.services.auth import admin_required
from datetime import datetime

router = APIRouter()


@router.get("", response_model=list[ArticleRead])
def list_articles(db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    return db.query(Article).options(joinedload(Article.tags)).order_by(Article.created_at.desc()).all()


@router.get("/{article_id}", response_model=ArticleRead)
def get_article(article_id: int, db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    article = db.query(Article).options(joinedload(Article.tags)).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article


@router.post("", response_model=ArticleRead)
def create_article(article: ArticleCreate, db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    from app.services.file_upload import FileUploadService

    # ИСПРАВЛЕНО: используем model_dump() вместо dict()
    article_data = article.model_dump()

    print(f"Получены данные статьи: {article_data}")  # Отладка

    # Обрабатываем base64 изображение
    featured_image_url = None
    if article_data.get('featured_image') and article_data['featured_image'].startswith('data:image/'):
        try:
            file_path = FileUploadService.save_base64_image(
                article_data['featured_image'],
                subfolder="blog"
            )
            featured_image_url = FileUploadService.get_file_url(file_path)
            print(f"Изображение сохранено: {featured_image_url}")
        except Exception as e:
            print(f"Ошибка сохранения изображения: {e}")
            featured_image_url = None

    # Подготавливаем данные для создания статьи (без категорий и тегов)
    new_article_data = {
        "title": article_data["title"],
        "slug": article_data["slug"],
        "content": article_data["content"],
        "excerpt": article_data.get("excerpt"),
        "game_id": article_data.get("game_id"),
        "author_name": article_data.get("author_name", "Администратор"),
        "featured_image_url": featured_image_url,
        "featured_image_alt": article_data.get("featured_image_alt"),
        "published": article_data.get("published", False)
    }

    # Устанавливаем основную категорию для совместимости
    if article_data.get("categories") and len(article_data["categories"]) > 0:
        new_article_data["category"] = article_data["categories"][0]
    elif article_data.get("category"):
        new_article_data["category"] = article_data["category"]

    # Убираем None значения
    new_article_data = {k: v for k, v in new_article_data.items() if v is not None}

    # Создаем статью
    new_article = Article(**new_article_data)

    # Устанавливаем published_at если статья публикуется
    if new_article.published:
        new_article.published_at = datetime.utcnow()

    db.add(new_article)
    db.commit()
    db.refresh(new_article)

    # Обрабатываем категории как специальные теги
    if article_data.get("categories"):
        for category_name in article_data["categories"]:
            if not category_name.strip():
                continue
            new_article.add_category(category_name.strip(), db)

    # Обрабатываем обычные теги
    if article_data.get("tags"):
        for tag_name in article_data["tags"]:
            if not tag_name.strip():
                continue
            new_article.add_tag(tag_name.strip(), db)

    db.commit()
    db.refresh(new_article)

    categories = new_article.get_category_names()
    tags = new_article.get_tag_names()
    print(f"Статья создана с категориями: {categories} и тегами: {tags}")

    return new_article


@router.put("/{article_id}", response_model=ArticleRead)
def update_article(article_id: int, article: ArticleUpdate, db: Session = Depends(get_db),
                   admin: User = Depends(admin_required)):
    db_article = db.query(Article).options(joinedload(Article.tags)).filter(Article.id == article_id).first()
    if not db_article:
        raise HTTPException(status_code=404, detail="Article not found")

    # ИСПРАВЛЕНО: используем model_dump() вместо dict()
    article_data = article.model_dump(exclude_unset=True)

    # Обрабатываем base64 изображение (если есть)
    if article_data.get('featured_image') and article_data['featured_image'].startswith('data:image/'):
        try:
            from app.services.file_upload import FileUploadService
            file_path = FileUploadService.save_base64_image(
                article_data['featured_image'],
                subfolder="blog"
            )
            article_data['featured_image_url'] = FileUploadService.get_file_url(file_path)
        except Exception as e:
            print(f"Ошибка сохранения изображения: {e}")

    # Обрабатываем обновление категорий и тегов
    if "categories" in article_data or "tags" in article_data:
        # Удаляем все старые теги
        db_article.tags.clear()

        # Добавляем новые категории
        if "categories" in article_data and article_data["categories"]:
            for category_name in article_data["categories"]:
                if category_name.strip():
                    db_article.add_category(category_name.strip(), db)

            # Обновляем основную категорию для совместимости
            article_data["category"] = article_data["categories"][0]

        # Добавляем новые теги
        if "tags" in article_data and article_data["tags"]:
            for tag_name in article_data["tags"]:
                if tag_name.strip():
                    db_article.add_tag(tag_name.strip(), db)

        # Удаляем categories и tags из данных для обновления модели
        article_data.pop("categories", None)
        article_data.pop("tags", None)

    # Убираем featured_image из данных если обрабатывали
    if 'featured_image' in article_data:
        del article_data['featured_image']

    # Обновляем поля статьи
    for field, value in article_data.items():
        setattr(db_article, field, value)

    # Устанавливаем/обновляем published_at
    if article_data.get("published") and not db_article.published_at:
        db_article.published_at = datetime.utcnow()
    elif not article_data.get("published", True):
        db_article.published_at = None

    db.commit()
    db.refresh(db_article)
    return db_article


@router.delete("/{article_id}")
def delete_article(article_id: int, db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    db_article = db.query(Article).filter(Article.id == article_id).first()
    if not db_article:
        raise HTTPException(status_code=404, detail="Article not found")

    db.delete(db_article)
    db.commit()
    return {"detail": "Article deleted"}


# ЭНДПОИНТЫ ДЛЯ УПРАВЛЕНИЯ КАТЕГОРИЯМИ И ТЕГАМИ

@router.get("/categories/available")
def get_available_categories(db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    """Получить все доступные категории для админки"""
    categories = db.query(ArticleTag).filter(ArticleTag.is_category == True).all()
    return [{"name": cat.name, "slug": cat.slug, "color": cat.color} for cat in categories]


@router.get("/tags/available")
def get_available_tags(db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    """Получить все доступные теги для админки"""
    tags = db.query(ArticleTag).filter(ArticleTag.is_category == False).all()
    return [{"name": tag.name, "slug": tag.slug, "color": tag.color} for tag in tags]


@router.post("/categories")
def create_category(category_data: dict, db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    """Создать новую категорию"""
    name = category_data.get("name", "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Category name is required")

    # Проверяем, не существует ли уже такая категория
    existing = db.query(ArticleTag).filter_by(name=name, is_category=True).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")

    # Создаем категорию
    slug = name.lower().replace(" ", "-").replace("ё", "e")
    import re
    slug = re.sub(r'[^a-za-я0-9\-]', '', slug)

    category = ArticleTag(
        name=name,
        slug=slug,
        is_category=True,
        color=category_data.get("color", "#3B82F6")
    )

    db.add(category)
    db.commit()
    db.refresh(category)

    return {"name": category.name, "slug": category.slug, "color": category.color}