"""唯一 LLM 出口 — DeepSeek Chat Completions。"""
from __future__ import annotations

import json
import os
import re
from pathlib import Path
from typing import Any

import httpx
from dotenv import load_dotenv

# repo root .env
_ROOT = Path(__file__).resolve().parents[3]
load_dotenv(_ROOT / ".env")
load_dotenv()


class AIService:
    def __init__(self) -> None:
        self.use_mock = os.getenv("USE_MOCK", "false").lower() == "true"
        self.api_key = os.getenv("DEEPSEEK_API_KEY", "")
        self.base_url = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com").rstrip("/")
        self.model = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")

    def chat(
        self,
        messages: list[dict[str, str]],
        *,
        temperature: float = 0.4,
        json_mode: bool = True,
    ) -> dict[str, Any]:
        if self.use_mock or not self.api_key:
            return {"mock": True, "content": "", "parsed": None}

        payload: dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
        }
        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        with httpx.Client(timeout=120.0) as client:
            r = client.post(
                f"{self.base_url}/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            r.raise_for_status()
            data = r.json()

        content = data["choices"][0]["message"]["content"] or ""
        parsed = None
        if json_mode:
            parsed = self._parse_json(content)
        return {"mock": False, "content": content, "parsed": parsed, "raw": data}

    def chat_json(
        self,
        system: str,
        user: str,
        *,
        temperature: float = 0.4,
    ) -> dict[str, Any]:
        res = self.chat(
            [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=temperature,
            json_mode=True,
        )
        if res.get("mock"):
            raise RuntimeError("AI mock mode — set USE_MOCK=false and DEEPSEEK_API_KEY")
        if not isinstance(res.get("parsed"), dict):
            raise RuntimeError(f"AI 未返回合法 JSON: {res.get('content', '')[:400]}")
        return res["parsed"]

    @staticmethod
    def _parse_json(text: str) -> dict[str, Any] | None:
        text = text.strip()
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            m = re.search(r"\{[\s\S]*\}", text)
            if not m:
                return None
            try:
                return json.loads(m.group(0))
            except json.JSONDecodeError:
                return None


ai_service = AIService()
