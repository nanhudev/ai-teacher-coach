from fastapi import APIRouter

from app.api import demo, knowledge, review

api_router = APIRouter()
api_router.include_router(demo.router, tags=["demo"])
api_router.include_router(knowledge.router)
api_router.include_router(review.router)
