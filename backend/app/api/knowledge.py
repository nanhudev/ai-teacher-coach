from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.agents.knowledge_retrieval_agent import retrieve_chinese_knowledge
from app.services.search_service import search_chinese_topic

router = APIRouter(prefix="/knowledge", tags=["knowledge"])


class SearchBody(BaseModel):
    topic: str
    subject: str = "高中语文"
    allow_internet: bool = Field(
        default=False,
        description="默认关闭。开启后仍返回低置信片段，须前端 Verifier 再审。",
    )


@router.post("/search")
def knowledge_search(body: SearchBody):
    chunks = search_chinese_topic(body.topic, allow_internet=body.allow_internet)
    return {"chunks": chunks, "count": len(chunks)}


@router.post("/retrieve")
def knowledge_retrieve(body: SearchBody):
    return retrieve_chinese_knowledge(
        subject=body.subject,
        topic=body.topic,
        allow_internet=body.allow_internet,
    )
