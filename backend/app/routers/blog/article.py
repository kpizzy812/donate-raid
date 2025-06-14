# backend/app/routers/blog/article.py - ФИНАЛЬНАЯ ИСПРАВЛЕННАЯ ВЕРСИЯ
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.core.database import get_db
from app.models.blog.article import Article
from app.schemas.blog.article import ArticleCreate, ArticleRead

router = APIRouter()


@router.get("/", response_model=List[ArticleRead])
def get_articles(
        db: Session = Depends(get_db),
        q: str = Query("", alias="q"),
        category: Optional[str] = None,
        game_id: Optional[int] = None
):
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
    for article in articles:
        print(f"Статья '{article.title}' имеет {len(article.tags)} тегов: {[tag.name for tag in article.tags]}")

    return articles


@router.get("/{slug}", response_model=ArticleRead)
def get_article(slug: str, db: Session = Depends(get_db)):
    # Используем joinedload для загрузки тегов
    article = (
        db.query(Article)
        .options(joinedload(Article.tags))
        .filter(Article.slug == slug, Article.published == True)
        .first()
    )

    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    # Логируем для отладки
    print(f"Найдена статья '{article.title}' с {len(article.tags)} тегами: {[tag.name for tag in article.tags]}")

    return article