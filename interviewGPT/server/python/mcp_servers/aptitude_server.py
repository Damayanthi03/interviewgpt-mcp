"""Aptitude MCP Server — evaluates aptitude answers and provides topic-wise scoring."""

import json
import os

from mcp.server.fastmcp import FastMCP

mcp = FastMCP("Aptitude MCP Server")

HAS_OPENAI = bool(os.environ.get("OPENAI_API_KEY"))


@mcp.tool()
async def evaluate_aptitude_answers(category: str, answers: list, questions: list) -> str:
    """
    Evaluate aptitude quiz answers. Returns score, correct/incorrect breakdown,
    explanations, and topic-wise performance analysis.
    """
    correct = 0
    results = []
    explanations = []

    q_map = {q["id"]: q for q in questions}

    for ans in answers:
        qid = ans.get("questionId") or ans.get("id")
        selected = ans.get("selectedOption") if ans.get("selectedOption") is not None else ans.get("answer")
        q = q_map.get(qid)
        if not q:
            continue
        is_correct = selected == q["answer"]
        if is_correct:
            correct += 1
        results.append({
            "questionId": qid,
            "question": q["question"],
            "selectedOption": selected,
            "correctOption": q["answer"],
            "correctAnswer": q["options"][q["answer"]] if q["options"] and 0 <= q["answer"] < len(q["options"]) else "",
            "isCorrect": is_correct,
            "explanation": q.get("explanation", ""),
        })
        if not is_correct:
            explanations.append(f'Q: {q["question"][:60]}... → {q.get("explanation","")}')

    total = len(results)
    score = round((correct / total) * 100) if total > 0 else 0

    label = "Excellent" if score >= 80 else "Good" if score >= 60 else "Needs Practice" if score >= 40 else "Keep Practicing"

    improvement_tips = {
        "Quantitative": ["Practice speed-math daily", "Learn shortcut formulas for percentages/ratios", "Time yourself on each question"],
        "Logical": ["Practice syllogisms and coding patterns", "Study Venn diagrams", "Solve puzzle books"],
        "Verbal": ["Read newspapers daily for vocabulary", "Practice grammar correction exercises", "Use a word-a-day app"],
        "Data Interpretation": ["Practice bar/pie chart reading", "Learn estimation shortcuts", "Work through CAT/GMAT DI sets"],
    }

    return json.dumps({
        "score": score,
        "total": total,
        "correct": correct,
        "incorrect": total - correct,
        "label": label,
        "category": category,
        "results": results,
        "explanations": explanations[:3],
        "improvement_tips": improvement_tips.get(category, ["Practice regularly", "Review incorrect answers"]),
        "topic_score": {
            "accuracy": f"{score}%",
            "speed_rating": "Good" if score >= 70 else "Needs Work",
            "recommendation": (
                f"Strong performance in {category}! Focus on time management." if score >= 80
                else f"Good foundation in {category}. Review the explanations above." if score >= 60
                else f"Keep practicing {category}. Focus on the concepts behind incorrect answers."
            ),
        },
    })


@mcp.tool()
async def generate_aptitude_question(category: str, difficulty: str) -> str:
    """
    Generate a new aptitude question for a given category and difficulty.
    Returns question, options, answer index, and explanation.
    """
    if HAS_OPENAI:
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])
            resp = await client.chat.completions.create(
                model="gpt-4o-mini", max_tokens=512,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": 'Generate an aptitude question. Return JSON: {"question":"...","options":["A","B","C","D"],"answer":<0-3>,"explanation":"..."}'},
                    {"role": "user", "content": f"Generate a {difficulty} {category} aptitude question for a campus placement test."}
                ]
            )
            return resp.choices[0].message.content
        except Exception:
            pass

    return json.dumps({
        "question": f"Sample {category} question ({difficulty}): If a car travels 120 km in 2 hours, what is its speed?",
        "options": ["50 km/h", "60 km/h", "70 km/h", "80 km/h"],
        "answer": 1,
        "explanation": "Speed = Distance / Time = 120/2 = 60 km/h",
    })


if __name__ == "__main__":
    mcp.run()
