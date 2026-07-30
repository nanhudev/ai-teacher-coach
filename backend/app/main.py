import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.router import api_router

_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(_ROOT / ".env")

# 部署到 https://bubbleapp.cn/aiteacher 时设置 ROOT_PATH=/aiteacher
ROOT_PATH = os.getenv("ROOT_PATH", "").rstrip("/")

app = FastAPI(
    title="AI Teacher Coach",
    version="0.3.0",
    root_path=ROOT_PATH or "",
)

_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://bubbleapp.cn",
    "http://bubbleapp.cn",
]
_extra = os.getenv("CORS_ORIGINS", "")
if _extra:
    _origins.extend([x.strip() for x in _extra.split(",") if x.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")
# CloudBase 自定义域名开启路径透传时保留站点前缀。
app.include_router(api_router, prefix="/aiteacher/api/v1")
# CloudBase 自定义路由也可能剥离匹配前缀，仅把剩余 /v1 传给容器。
app.include_router(api_router, prefix="/v1")

# 生产一体部署：SERVE_SPA=true 且已 npm run build
if os.getenv("SERVE_SPA", "").lower() == "true":
    _static = _ROOT / "frontend" / "dist"
    if _static.exists():
        app.mount("/", StaticFiles(directory=str(_static), html=True), name="spa")


@app.get("/health")
def health():
    return {
        "ok": True,
        "mode": "mock" if os.getenv("USE_MOCK", "false").lower() == "true" else "live",
        "has_key": bool(os.getenv("DEEPSEEK_API_KEY")),
        "root_path": ROOT_PATH or "/",
    }
