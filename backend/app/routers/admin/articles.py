from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.blog.article import Article
from app.schemas.admin.articles import ArticleCreate, ArticleUpdate, ArticleRead
from app.services.auth import get_current_user
from app.models.user import User
from app.services.auth import admin_required

router = APIRouter()

@router.get("/", response_model=list[ArticleRead])
def list_articles(db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    return db.query(Article).order_by(Article.created_at.desc()).all()

@router.post("/", response_model=ArticleRead)
def create_article(article: ArticleCreate, db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    new_article = Article(**article.dict())
    db.add(new_article)
    db.commit()
    db.refresh(new_article)
    return new_article

@router.put("/{article_id}", response_model=ArticleRead)
def update_article(article_id: int, article: ArticleUpdate, db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    db_article = db.query(Article).filter(Article.id == article_id).first()
    if not db_article:
        raise HTTPException(status_code=404, detail="Article not found")
    for field, value in article.dict(exclude_unset=True).items():
        setattr(db_article, field, value)
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
