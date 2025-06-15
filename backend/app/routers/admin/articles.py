# backend/app/routers/admin/articles.py - ПОЛНОСТЬЮ ИСПРАВЛЕННАЯ ВЕРСИЯ
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.blog.article import Article, ArticleTag
from app.schemas.admin.articles import ArticleCreate, ArticleUpdate, ArticleRead
from app.services.auth import get_current_user
from app.models.user import User
from app.services.auth import admin_required
from datetime import datetime

router = APIRouter()


@router.get("/", response_model=list[ArticleRead])
def list_articles(db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    return db.query(Article).order_by(Article.created_at.desc()).all()


@router.post("/", response_model=ArticleRead)
def create_article(article: ArticleCreate, db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    from app.services.file_upload import FileUploadService

    # Конвертируем данные для модели
    article_data = article.dict()

    print(f"Получены данные статьи: {article_data}")  # Отладка

    # Обрабатываем base64 изображение
    featured_image_url = None
    if article_data.get('featured_image') and article_data['featured_image'].startswith('data:image/'):
        try:
            # Конвертируем base64 в файл
            file_path = FileUploadService.save_base64_image(
                article_data['featured_image'],
                subfolder="blog"
            )
            # ИСПРАВЛЕНО: используем правильный метод с одним параметром
            featured_image_url = FileUploadService.get_file_url(file_path)
            print(f"Изображение сохранено: {featured_image_url}")
        except Exception as e:
            print(f"Ошибка сохранения изображения: {e}")
            featured_image_url = None

    # Подготавливаем данные для создания статьи
    new_article_data = {
        "title": article_data["title"],
        "slug": article_data["slug"],
        "content": article_data["content"],
        "excerpt": article_data.get("excerpt"),
        "category": article_data.get("category"),
        "game_id": article_data.get("game_id"),
        "author_name": article_data.get("author_name", "Администратор"),
        "featured_image_url": featured_image_url,
        "featured_image_alt": article_data.get("featured_image_alt"),
        "published": article_data.get("published", False)
    }

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

    # Обрабатываем теги
    if article_data.get("tags"):
        for tag_name in article_data["tags"]:
            tag = db.query(ArticleTag).filter_by(name=tag_name).first()
            if not tag:
                # Создаем новый тег
                tag_slug = tag_name.lower().replace(" ", "-")
                tag = ArticleTag(name=tag_name, slug=tag_slug)
                db.add(tag)
                db.commit()
                db.refresh(tag)

            new_article.tags.append(tag)

        db.commit()
        db.refresh(new_article)

    return new_article


@router.put("/{article_id}", response_model=ArticleRead)
def update_article(article_id: int, article: ArticleUpdate, db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    from app.services.file_upload import FileUploadService

    db_article = db.query(Article).filter(Article.id == article_id).first()
    if not db_article:
        raise HTTPException(status_code=404, detail="Article not found")

    # Конвертируем данные для обновления
    article_data = article.dict(exclude_unset=True)

    # Обрабатываем base64 изображение
    if article_data.get('featured_image') and article_data['featured_image'].startswith('data:image/'):
        try:
            # Конвертируем base64 в файл
            file_path = FileUploadService.save_base64_image(
                article_data['featured_image'],
                subfolder="blog"
            )
            # ИСПРАВЛЕНО: используем правильный метод с одним параметром
            article_data['featured_image_url'] = FileUploadService.get_file_url(file_path)
        except Exception as e:
            print(f"Ошибка сохранения изображения: {e}")

    # Удаляем поле featured_image, так как оно не нужно в модели
    article_data.pop('featured_image', None)

    # Обрабатываем теги
    if 'tags' in article_data:
        # Очищаем существующие теги
        db_article.tags.clear()

        # Добавляем новые теги
        for tag_name in article_data["tags"]:
            tag = db.query(ArticleTag).filter_by(name=tag_name).first()
            if not tag:
                # Создаем новый тег
                tag_slug = tag_name.lower().replace(" ", "-")
                tag = ArticleTag(name=tag_name, slug=tag_slug)
                db.add(tag)
                db.commit()
                db.refresh(tag)

            db_article.tags.append(tag)

        # Удаляем теги из данных для обновления
        del article_data["tags"]

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


@router.get("/{article_id}", response_model=ArticleRead)
def get_article(article_id: int, db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article