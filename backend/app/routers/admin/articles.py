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

    # Обрабатываем base64 изображение
    featured_image_url = None
    if article_data.get('featured_image') and article_data['featured_image'].startswith('data:image/'):
        try:
            # Конвертируем base64 в файл
            file_path = FileUploadService.save_base64_image(
                article_data['featured_image'],
                subfolder="blog"
            )
            # ИСПРАВЛЕНО: передаем пустую строку вместо settings.FRONTEND_URL
            featured_image_url = FileUploadService.get_file_url(file_path, "")
        except Exception as e:
            print(f"Ошибка сохранения base64 изображения: {e}")
            featured_image_url = None
    elif article_data.get('featured_image'):
        # Если это обычный URL
        featured_image_url = article_data['featured_image']

    # Устанавливаем правильное поле
    article_data['featured_image_url'] = featured_image_url

    # Удаляем поля, которых нет в модели
    article_data.pop('featured_image', None)
    tags_list = article_data.pop('tags', None)
    categories_list = article_data.pop('categories', None)

    # Если category не задан, берем первый из categories
    if not article_data.get('category') and categories_list:
        article_data['category'] = categories_list[0]

    # Создаем статью
    new_article = Article(**article_data)
    db.add(new_article)
    db.commit()
    db.refresh(new_article)

    # Обрабатываем теги (если нужно)
    if tags_list:
        for tag_name in tags_list:
            # Находим или создаем тег
            tag = db.query(ArticleTag).filter(ArticleTag.name == tag_name).first()
            if not tag:
                tag_slug = tag_name.lower().replace(' ', '-').replace('_', '-')
                tag = ArticleTag(name=tag_name, slug=tag_slug)
                db.add(tag)
                db.commit()

            # Добавляем тег к статье
            if tag not in new_article.tags:
                new_article.tags.append(tag)

    db.commit()
    db.refresh(new_article)

    return new_article


@router.get("/{article_id}", response_model=ArticleRead)
def get_article(article_id: int, db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Статья не найдена")
    return article


@router.put("/{article_id}", response_model=ArticleRead)
def update_article(
    article_id: int,
    article_update: ArticleUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(admin_required)
):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Статья не найдена")

    # Обновляем данные
    for field, value in article_update.dict(exclude_unset=True).items():
        setattr(article, field, value)

    db.commit()
    db.refresh(article)
    return article


@router.delete("/{article_id}")
def delete_article(article_id: int, db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Статья не найдена")

    db.delete(article)
    db.commit()
    return {"message": "Статья удалена"}