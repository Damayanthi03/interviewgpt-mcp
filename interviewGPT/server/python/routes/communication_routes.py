from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from mcp_client import mcp

router = APIRouter(prefix="/communication")

FILLER_WORDS = [
    "umm","um","hmm","ah","uh","like","actually","basically",
    "you know","i mean","right","so","well","okay","kind of","sort of",
]


def detect_fillers(text: str) -> list[dict]:
    import re
    lower = text.lower()
    result = []
    for word in FILLER_WORDS:
        pattern = r'\b' + re.escape(word) + r'\b'
        matches = re.findall(pattern, lower)
        if matches:
            result.append({"word": word, "count": len(matches)})
    return sorted(result, key=lambda x: -x["count"])


class AnalyzeBody(BaseModel):
    transcript: str
    durationSeconds: float = 0.0


@router.post("/analyze")
async def analyze_speech(body: AnalyzeBody):
    if not body.transcript or len(body.transcript.strip()) < 10:
        raise HTTPException(400, "Transcript is too short to analyze")

    filler_words = detect_fillers(body.transcript)
    total_fillers = sum(f["count"] for f in filler_words)
    word_count = len(body.transcript.strip().split())
    filler_rate = round((total_fillers / word_count) * 100) if word_count > 0 else 0
    speaking_speed = (
        round((word_count / body.durationSeconds) * 60)
        if body.durationSeconds > 0 else None
    )

    result = await mcp.call_tool("communication", "analyze_speech", {
        "transcript": body.transcript,
        "word_count": word_count,
        "filler_words": filler_words,
        "total_filler_count": total_fillers,
        "filler_rate_percent": filler_rate,
        "speaking_speed_wpm": speaking_speed,
        "duration_seconds": body.durationSeconds,
    })

    return {
        "success": True,
        "data": {
            **result,
            "filler_words": filler_words,
            "total_filler_count": total_fillers,
            "filler_rate_percent": filler_rate,
            "word_count": word_count,
            "speaking_speed_wpm": speaking_speed,
            "duration_seconds": body.durationSeconds if body.durationSeconds > 0 else None,
        }
    }
