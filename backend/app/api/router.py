from fastapi import APIRouter

from app.api import demo, knowledge, review, telemetry

api_router = APIRouter()
api_router.include_router(demo.router, tags=["demo"])
api_router.include_router(knowledge.router)
api_router.include_router(review.router)
api_router.include_router(telemetry.router, tags=["telemetry"])
