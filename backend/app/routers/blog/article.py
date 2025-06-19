# backend/app/routers/blog/article.py - ОБНОВЛЕННЫЙ API С МНОЖЕСТВЕННЫМИ КАТЕГОРИЯМИ И ТЕГАМИ
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_
from typing import List, Optional
from app.core.database import get_db
from app.models.blog.article import Article, ArticleTag
from app.schemas.blog.article import ArticleRead

router = APIRouter()


@router.get("", response_model=List[ArticleRead])
def get_articles(
        db: Session = Depends(get_db),
        q: str = Query("", alias="q"),
        category: Optional[str] = None,
        tag: Optional[str] = None,
        categories: Optional[str] = Query(None, description="Список категорий через запятую"),
        tags: Optional[str] = Query(None, description="Список тегов через запятую"),
        game_id: Optional[int] = None
):
    """
    Получить список всех опубликованных статей с расширенной фильтрацией

    Параметры:
    - q: поиск по заголовку и содержимому
    - category: одна категория (для совместимости)
    - tag: один тег
    - categories: несколько категорий через запятую (например: "Новости,Гайды")
    - tags: несколько тегов через запятую (например: "CS2,Dota2")
    - game_id: ID игры
    """
    # Используем joinedload для загрузки тегов
    query = db.query(Article).options(joinedload(Article.tags)).filter(Article.published == True)

    # Поиск по тексту (заголовок + содержимое)
    if q:
        search_filter = or_(
            Article.title.ilike(f"%{q}%"),
            Article.content.ilike(f"%{q}%"),
            Article.excerpt.ilike(f"%{q}%")
        )
        query = query.filter(search_filter)

    # Фильтрация по игре
    if game_id:
        query = query.filter(Article.game_id == game_id)

    # Фильтрация по категориям
    category_filters = []

    # Одна категория (для совместимости)
    if category:
        category_filters.append(category)

    # Множественные категории
    if categories:
        category_list = [cat.strip() for cat in categories.split(',') if cat.strip()]
        category_filters.extend(category_list)

    if category_filters:
        # Ищем статьи, которые имеют хотя бы одну из указанных категорий
        category_tag_ids = db.query(ArticleTag.id).filter(
            and_(
                ArticleTag.name.in_(category_filters),
                ArticleTag.is_category == True
            )
        ).subquery()

        query = query.join(Article.tags).filter(ArticleTag.id.in_(category_tag_ids))

    # Фильтрация по тегам
    tag_filters = []

    # Один тег
    if tag:
        tag_filters.append(tag)

    # Множественные теги
    if tags:
        tag_list = [tag_name.strip() for tag_name in tags.split(',') if tag_name.strip()]
        tag_filters.extend(tag_list)

    if tag_filters:
        # Ищем статьи, которые имеют хотя бы один из указанных тегов
        tag_tag_ids = db.query(ArticleTag.id).filter(
            and_(
                ArticleTag.name.in_(tag_filters),
                ArticleTag.is_category == False
            )
        ).subquery()

        if category_filters:
            # Если уже фильтруем по категориям, добавляем фильтр по тегам
            query = query.filter(Article.tags.any(ArticleTag.id.in_(tag_tag_ids)))
        else:
            # Если фильтруем только по тегам
            query = query.join(Article.tags).filter(ArticleTag.id.in_(tag_tag_ids))

    articles = query.order_by(Article.created_at.desc()).distinct().all()

    # Логируем для отладки
    print(f"Поиск: q='{q}', category='{category}', categories='{categories}', tag='{tag}', tags='{tags}'")
    print(f"Найдено {len(articles)} статей")

    return articles


@router.get("/categories", response_model=List[dict])
def get_categories(db: Session = Depends(get_db)):
    """Получить все доступные категории"""
    categories = db.query(ArticleTag).filter(ArticleTag.is_category == True).all()

    # Добавляем количество статей для каждой категории
    result = []
    for category in categories:
        article_count = db.query(Article).join(Article.tags).filter(
            ArticleTag.id == category.id,
            Article.published == True
        ).count()

        result.append({
            "id": category.id,
            "name": category.name,
            "slug": category.slug,
            "color": category.color,
            "article_count": article_count
        })

    return result


@router.get("/tags", response_model=List[dict])
def get_tags(db: Session = Depends(get_db)):
    """Получить все доступные теги (не категории)"""
    tags = db.query(ArticleTag).filter(ArticleTag.is_category == False).all()

    # Добавляем количество статей для каждого тега
    result = []
    for tag in tags:
        article_count = db.query(Article).join(Article.tags).filter(
            ArticleTag.id == tag.id,
            Article.published == True
        ).count()

        if article_count > 0:  # Показываем только теги с статьями
            result.append({
                "id": tag.id,
                "name": tag.name,
                "slug": tag.slug,
                "color": tag.color,
                "article_count": article_count
            })

    return sorted(result, key=lambda x: x['article_count'], reverse=True)


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
    categories = article.get_category_names()
    tags = article.get_tag_names()
    print(f"Найдена статья '{article.title}' с категориями: {categories} и тегами: {tags}")

    return article