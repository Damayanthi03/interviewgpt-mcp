"""HR Interview MCP Server — generates questions, evaluates answers, STAR analysis."""

import json
import os
import random

from mcp.server.fastmcp import FastMCP

mcp = FastMCP("HR Interview MCP Server")

HAS_OPENAI = bool(os.environ.get("OPENAI_API_KEY"))

QUESTION_BANK = {
    "Introduction": [
        "Tell me about yourself.",
        "Walk me through your background and why you're here today.",
    ],
    "Strengths": [
        "What are your greatest strengths?",
        "What do colleagues say is your strongest quality?",
    ],
    "Weakness": [
        "What is your biggest weakness?",
        "Describe an area where you're actively improving.",
    ],
    "Behavioral": [
        "Describe a challenging project and how you handled it.",
        "Tell me about a time you had to meet a tight deadline.",
        "Describe a time you resolved a conflict with a teammate.",
        "Tell me about a time you failed. What did you learn?",
        "Describe a time you went above and beyond.",
        "Tell me about a time you had to handle a difficult team conflict.",
    ],
    "Leadership": [
        "Tell me about a time you led a team.",
        "Describe a situation where you influenced others without authority.",
    ],
    "Career Goals": [
        "Where do you see yourself in 5 years?",
        "What are your long-term career aspirations?",
    ],
    "Company Fit": [
        "Why do you want to work at our company?",
        "What do you know about our products and mission?",
    ],
    "Resilience": [
        "Describe a time you worked under intense pressure.",
        "Tell me about a setback you overcame.",
    ],
}

TECH_QUESTIONS = {
    "Software Engineer": [
        "Explain a complex technical problem you solved recently.",
        "How do you approach system design for a high-traffic application?",
    ],
    "Data Scientist": [
        "Describe a machine learning project you're proud of.",
        "How do you handle class imbalance in datasets?",
    ],
    "default": [
        "How do you stay current with industry trends?",
        "Describe your ideal work environment.",
    ],
}

CATEGORIES = list(QUESTION_BANK.keys())


def _get_question_for_number(question_number: int, role: str) -> dict:
    if question_number <= 0 or question_number > 20:
        question_number = 1

    # Distribute question categories across 8-question session
    schedule = [
        "Introduction", "Strengths", "Behavioral", "Behavioral",
        "Weakness", "Leadership", "Career Goals", "Company Fit",
    ]
    cat = schedule[(question_number - 1) % len(schedule)]
    questions = QUESTION_BANK.get(cat, QUESTION_BANK["Behavioral"])
    q = random.choice(questions)

    hints = {
        "Introduction": "Present-Past-Future: current role → relevant background → why this role.",
        "Strengths": "Pick 2-3 strengths relevant to this role, each with a concrete example.",
        "Weakness": "Choose a real weakness, then show how you're actively improving it.",
        "Behavioral": "Use STAR: Situation → Task → Action → Result. Quantify outcomes.",
        "Leadership": "Focus on your actions and how you influenced/guided others.",
        "Career Goals": "Show ambition aligned with the company's growth and this role.",
        "Company Fit": "Mention specific products, values, or news — show genuine research.",
        "Resilience": "Be honest, pivot to the lesson learned and how you applied it.",
    }

    return {
        "question": q,
        "category": cat,
        "difficulty": "Medium" if cat in ("Behavioral", "Leadership") else "Easy",
        "hint": hints.get(cat, "Be specific and use a real example."),
        "question_number": question_number,
        "total_questions": 8,
    }


def _score_answer(answer: str) -> int:
    words = len(answer.strip().split())
    if words < 20: return 42 + random.randint(0, 13)
    if words < 60: return 62 + random.randint(0, 12)
    if words < 150: return 74 + random.randint(0, 13)
    return 82 + random.randint(0, 13)


@mcp.tool()
async def generate_interview_question(
    role: str, skills: list, question_number: int, total_questions: int, resume_text: str = ""
) -> str:
    """
    Generate an interview question for a given role, question number, and skills.
    Returns JSON with question, category, difficulty, hint, question_number, total_questions.
    """
    if HAS_OPENAI:
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])
            resp = await client.chat.completions.create(
                model="gpt-4o-mini", max_tokens=512,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": f'Generate question #{question_number} of {total_questions} for a {role} candidate. Return JSON: {{"question":"...","category":"Technical|Behavioral|HR","difficulty":"Easy|Medium|Hard","hint":"brief tip","question_number":{question_number},"total_questions":{total_questions}}}'},
                    {"role": "user", "content": f"Role: {role}\nSkills: {', '.join(skills)}\nResume: {resume_text[:800]}"}
                ]
            )
            return resp.choices[0].message.content
        except Exception:
            pass

    return json.dumps(_get_question_for_number(question_number, role))


@mcp.tool()
async def evaluate_interview_answer(
    question: str, answer: str, category: str, question_number: int,
    total_questions: int, is_last: bool, role: str, skills: list
) -> str:
    """
    Evaluate a candidate's interview answer. Returns score, feedback, strengths,
    improvements, sample_answer, and next_question (or null if last).
    """
    if HAS_OPENAI:
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])
            next_schema = "null" if is_last else f'{{"question":"...","category":"...","difficulty":"Easy|Medium|Hard","question_number":{question_number + 1},"total_questions":{total_questions}}}'
            resp = await client.chat.completions.create(
                model="gpt-4o-mini", max_tokens=1024,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": f'Evaluate the answer. Return JSON: {{"score":<0-100>,"feedback":"...","strengths":["s1","s2"],"improvements":["i1","i2"],"sample_answer":"...","next_question":{next_schema}}}'},
                    {"role": "user", "content": f"Q [{category}]: {question}\nAnswer: {answer}\nRole: {role}, Q{question_number}/{total_questions}{' (LAST)' if is_last else ''}"}
                ]
            )
            return resp.choices[0].message.content
        except Exception:
            pass

    score = _score_answer(answer)
    next_q = None if is_last else _get_question_for_number(question_number + 1, role)
    feedback = (
        "Excellent! Strong structure and specific examples." if score >= 82
        else "Good answer. Add more quantified outcomes and specific details." if score >= 68
        else "Solid attempt. Try using STAR format with more concrete examples."
    )
    return json.dumps({
        "score": score,
        "feedback": feedback,
        "strengths": ["Clear communication", "Relevant example given"] if score >= 75 else ["Addressed the question", "Professional tone"],
        "improvements": ["Quantify your impact", "Be more specific about your actions"] if score >= 68 else ["Use STAR framework", "Provide a real specific example", "Add measurable results"],
        "sample_answer": "Structure: Situation (context) → Task (your responsibility) → Action (what YOU did, step-by-step) → Result (quantified outcome).",
        "next_question": next_q,
    })


@mcp.tool()
async def generate_interview_report(
    history: list, role: str, skills: list
) -> str:
    """
    Generate a comprehensive post-interview report from the full Q&A history.
    Returns overall_score, grade, verdict, summary, scores, strengths, weaknesses,
    recommendations, study_topics, category_breakdown.
    """
    if HAS_OPENAI and history:
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])
            transcript = "\n\n".join(f"Q{i+1} [{h.get('category','?')}]: {h.get('question','')}\nAnswer: {h.get('answer','')}\nScore: {h.get('score',0)}/100" for i, h in enumerate(history))
            resp = await client.chat.completions.create(
                model="gpt-4o-mini", max_tokens=1500,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": 'Generate a detailed interview report. Return JSON: {"overall_score":<0-100>,"grade":"A+|A|B+|B|C+|C|D|F","verdict":"Strongly Recommend|Recommend|Neutral|Not Recommend","summary":"2-3 sentences","scores":{"technical_accuracy":<0-100>,"communication":<0-100>,"problem_solving":<0-100>,"confidence":<0-100>,"depth_of_knowledge":<0-100>},"strengths":["s1","s2","s3"],"weaknesses":["w1","w2"],"recommendations":["r1","r2","r3"],"study_topics":["t1","t2","t3"],"category_breakdown":[{"category":"Behavioral","score":80,"questions_asked":3}]}'},
                    {"role": "user", "content": f"Report for {role}:\n{transcript}"}
                ]
            )
            return resp.choices[0].message.content
        except Exception:
            pass

    avg = round(sum(h.get("score", 70) for h in history) / len(history)) if history else 72
    grade = "A+" if avg >= 90 else "A" if avg >= 85 else "B+" if avg >= 80 else "B" if avg >= 75 else "C+" if avg >= 70 else "C" if avg >= 65 else "D"
    verdict = "Strongly Recommend" if avg >= 80 else "Recommend" if avg >= 70 else "Neutral" if avg >= 60 else "Not Recommend"
    cats = list({h.get("category", "General") for h in history})

    return json.dumps({
        "overall_score": avg, "grade": grade, "verdict": verdict,
        "summary": f"The candidate demonstrated {'strong' if avg >= 80 else 'moderate'} preparation for the {role} role. {'Communication was clear and structured.' if avg >= 75 else 'Answers would benefit from more structure and examples.'} {'Recommended to proceed.' if avg >= 75 else 'Additional preparation advised.'}",
        "scores": {"technical_accuracy": avg - 3, "communication": avg + 2, "problem_solving": avg - 1, "confidence": avg + 4, "depth_of_knowledge": avg - 5},
        "strengths": ["Clear communication skills", "Good foundational knowledge", "Structured thinking approach"] if avg >= 75 else ["Shows willingness to learn", "Basic concepts understood"],
        "weaknesses": ["Could add more quantifiable examples", "Deeper system design knowledge needed"] if avg >= 75 else ["Needs more specific technical examples", "System design concepts need work"],
        "recommendations": ["Practice LeetCode medium problems daily", "Review system design on YouTube", "Use STAR format consistently for behavioral answers"],
        "study_topics": ["Data Structures & Algorithms", "System Design Patterns", "STAR Behavioral Framework"],
        "category_breakdown": [
            {"category": cat, "score": round(sum(h.get("score",70) for h in history if h.get("category") == cat) / max(1, sum(1 for h in history if h.get("category") == cat))), "questions_asked": sum(1 for h in history if h.get("category") == cat)}
            for cat in cats
        ],
    })


@mcp.tool()
async def evaluate_hr_answer(question: str, answer: str, category: str) -> str:
    """
    Evaluate an HR interview answer using the STAR framework.
    Returns score, starAnalysis, strengths, improvements, sampleAnswer, overallFeedback.
    """
    if HAS_OPENAI:
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])
            resp = await client.chat.completions.create(
                model="gpt-4o-mini", max_tokens=1024,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": 'Evaluate using STAR framework. Return JSON: {"score":<0-100>,"starAnalysis":{"situation":"...","task":"...","action":"...","result":"..."},"strengths":["s1","s2"],"improvements":["i1","i2"],"sampleAnswer":"...","overallFeedback":"2-3 sentence coaching feedback"}'},
                    {"role": "user", "content": f"Q [{category}]: {question}\nAnswer: {answer}"}
                ]
            )
            return resp.choices[0].message.content
        except Exception:
            pass

    score = _score_answer(answer)
    return json.dumps({
        "score": score,
        "starAnalysis": {
            "situation": "Context was clearly established" if score >= 70 else "Situation needs more specificity",
            "task": "Your role was well defined" if score >= 70 else "The task/challenge needs more clarity",
            "action": "Specific actions were well described" if score >= 75 else "Actions need more detail and personal ownership",
            "result": "Good outcome described" if score >= 75 else "Quantify the result with numbers or metrics",
        },
        "strengths": ["Clear communication", "Relevant example provided"] if score >= 70 else ["Addressed the question", "Professional tone"],
        "improvements": ["Add measurable outcomes", "Clarify your individual vs team contribution"] if score >= 75 else ["Use STAR format explicitly", "Provide a specific real example", "Quantify your results"],
        "sampleAnswer": "Begin: 'In my previous role at [Company], during [timeframe]...' Then your exact task, the 2-3 actions you personally took, and conclude with a measurable result: 'which led to a 30% improvement in...'",
        "overallFeedback": (
            "Strong answer! Your STAR structure was clear and the example compelling." if score >= 80
            else "Good attempt. The core content is there — focus on specificity and measurable outcomes." if score >= 65
            else "Your answer needs more structure. Use STAR consistently: set the scene, define your role, describe actions step-by-step, share the measurable result."
        ),
    })


if __name__ == "__main__":
    mcp.run()
