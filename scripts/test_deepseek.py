import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from app.services.ai_service import ai_service

print("mock=", ai_service.use_mock, "has_key=", bool(ai_service.api_key))
r = ai_service.chat_json(
    'Reply with JSON only: {"ok": true, "msg": string}',
    "msg should be hi",
)
print("ok", r)
