from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
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
    query = db.query(Article).filter(Article.published == True)

    if q:
        query = query.filter(Article.title.ilike(f"%{q}%"))
    if category:
        query = query.filter(Article.category == category)
    if game_id:
        query = query.filter(Article.game_id == game_id)

    return query.order_by(Article.created_at.desc()).all()


@router.get("/{slug}", response_model=ArticleRead)
def get_article(slug: str, db: Session = Depends(get_db)):
    article = db.query(Article).filter(Article.slug == slug, Article.published == True).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article

