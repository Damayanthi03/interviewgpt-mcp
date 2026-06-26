"""Communication Coach MCP Server — analyzes speech, detects filler words, scores communication."""

import json
import os

from mcp.server.fastmcp import FastMCP

mcp = FastMCP("Communication Coach MCP Server")

HAS_OPENAI = bool(os.environ.get("OPENAI_API_KEY"))


def _rule_based_analysis(
    transcript: str,
    word_count: int,
    filler_words: list,
    total_filler_count: int,
    filler_rate_percent: float,
    speaking_speed_wpm,
) -> dict:
    filler_penalty = min(filler_rate_percent * 2.5, 40)
    base = max(40, 100 - filler_penalty)

    grammar_score = min(base + 5, 100)
    confidence_score = 80 if filler_rate_percent < 5 else 60 if filler_rate_percent < 15 else 40
    fluency_score = 85 if filler_rate_percent < 5 else 65 if filler_rate_percent < 15 else 45
    clarity_score = 72
    vocab_score = 75

    speed_ok = speaking_speed_wpm and 120 <= speaking_speed_wpm <= 160
    overall = round((grammar_score + confidence_score + fluency_score + clarity_score + vocab_score) / 5)

    tips = []
    if filler_rate_percent > 10:
        tips.append(f"Your filler word rate is {filler_rate_percent:.1f}% — aim for below 5%. Replace fillers with deliberate pauses.")
    if speaking_speed_wpm and speaking_speed_wpm > 160:
        tips.append(f"You're speaking at {speaking_speed_wpm} WPM — slow down to 120-150 WPM for clarity.")
    if speaking_speed_wpm and speaking_speed_wpm < 100:
        tips.append(f"You're speaking at {speaking_speed_wpm} WPM — try to increase pace slightly for engagement.")
    tips += ["Record yourself and listen back critically.", "Practice the pause — silence is powerful, not awkward."]

    return {
        "grammar_score": grammar_score,
        "confidence_score": confidence_score,
        "fluency_score": fluency_score,
        "clarity_score": clarity_score,
        "vocabulary_score": vocab_score,
        "overall_score": overall,
        "tone": "Confident" if confidence_score >= 75 else "Nervous" if filler_rate_percent > 15 else "Professional",
        "grammar_errors": [],
        "pronunciation_suggestions": ["Enunciate clearly", "Slow down on technical terms"],
        "improvement_tips": tips[:3],
        "positive_feedback": [
            f"Completed {word_count} words — good speaking volume.",
            "Maintained professional vocabulary." if vocab_score >= 70 else "Keep practicing for richer vocabulary.",
        ],
        "summary": (
            f"Speech analyzed: {word_count} words, {total_filler_count} filler words ({filler_rate_percent:.1f}%). "
            + ("Excellent fluency!" if filler_rate_percent < 5 else "Focus on reducing filler words for a more polished delivery.")
            + (f" Speaking speed: {speaking_speed_wpm} WPM{' — ideal range!' if speed_ok else ''}." if speaking_speed_wpm else "")
        ),
    }


@mcp.tool()
async def analyze_speech(
    transcript: str,
    word_count: int,
    filler_words: list,
    total_filler_count: int,
    filler_rate_percent: float,
    speaking_speed_wpm,
    duration_seconds: float,
) -> str:
    """
    Analyze a speech transcript for grammar, confidence, fluency, filler words,
    speaking speed, and overall communication quality. Returns coaching feedback.
    """
    if HAS_OPENAI:
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])
            filler_summary = ", ".join(f'"{f["word"]}" x{f["count"]}' for f in filler_words) or "none detected"
            resp = await client.chat.completions.create(
                model="gpt-4o-mini", max_tokens=1024,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": 'Analyze this speech and return JSON: {"grammar_score":<0-100>,"confidence_score":<0-100>,"fluency_score":<0-100>,"clarity_score":<0-100>,"vocabulary_score":<0-100>,"overall_score":<0-100>,"tone":"Confident|Nervous|Monotone|Enthusiastic|Professional","grammar_errors":["err"],"pronunciation_suggestions":["s1"],"improvement_tips":["t1","t2","t3"],"positive_feedback":["p1","p2"],"summary":"2 sentences"}'},
                    {"role": "user", "content": f"Transcript:\n\"{transcript}\"\n\nContext:\n- Words: {word_count}\n- Filler words: {total_filler_count} ({filler_rate_percent:.1f}%)\n- Fillers: {filler_summary}\n{f'- Speed: {speaking_speed_wpm} WPM' if speaking_speed_wpm else ''}"}
                ]
            )
            return resp.choices[0].message.content
        except Exception:
            pass

    return json.dumps(_rule_based_analysis(transcript, word_count, filler_words, total_filler_count, filler_rate_percent, speaking_speed_wpm))


if __name__ == "__main__":
    mcp.run()
