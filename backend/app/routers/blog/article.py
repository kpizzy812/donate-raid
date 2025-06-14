# backend/app/routers/blog/article.py - ИСПРАВЛЕННАЯ ВЕРСИЯ
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.core.database import get_db
from app.models.blog.article import Article
from app.schemas.blog.article import ArticleRead

router = APIRouter()


@router.get("/", response_model=List[ArticleRead])
def get_articles(
        db: Session = Depends(get_db),
        q: str = Query("", alias="q"),
        category: Optional[str] = None,
        game_id: Optional[int] = None
):
    """Получить список всех опубликованных статей"""
    # Используем joinedload для загрузки тегов
    query = db.query(Article).options(joinedload(Article.tags)).filter(Article.published == True)

    if q:
        query = query.filter(Article.title.ilike(f"%{q}%"))
    if category:
        query = query.filter(Article.category == category)
    if game_id:
        query = query.filter(Article.game_id == game_id)

    articles = query.order_by(Article.created_at.desc()).all()

    # Логируем для отладки
    print(f"Найдено {len(articles)} статей")
    for article in articles:
        print(
            f"Статья '{article.title}' (slug: {article.slug}) имеет {len(article.tags)} тегов: {[tag.name for tag in article.tags]}")

    return articles


@router.get("/{slug}", response_model=ArticleRead)
def get_article(slug: str, db: Session = Depends(get_db)):
    """Получить статью по slug"""
    print(f"Поиск статьи по slug: '{slug}'")

    # Используем joinedload для загрузки тегов
    article = (
        db.query(Article)
        .options(joinedload(Article.tags))
        .filter(Article.slug == slug, Article.published == True)
        .first()
    )

    if not article:
        print(f"Статья с slug '{slug}' не найдена")
        # Для отладки - покажем все доступные slug
        all_articles = db.query(Article).filter(Article.published == True).all()
        available_slugs = [a.slug for a in all_articles]
        print(f"Доступные slug: {available_slugs}")
        raise HTTPException(status_code=404, detail="Article not found")

    # Логируем для отладки
    print(f"Найдена статья '{article.title}' с {len(article.tags)} тегами: {[tag.name for tag in article.tags]}")

    return article