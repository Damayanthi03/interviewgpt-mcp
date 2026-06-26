from typing import Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from mcp_client import mcp

router = APIRouter(prefix="/interview")


class StartBody(BaseModel):
    skills: list[str] = []
    role: str = "Software Engineer"
    resumeText: str = ""


class EvaluateBody(BaseModel):
    question: str
    answer: str
    category: str = "Technical"
    questionNumber: int = 1
    totalQuestions: int = 8
    skills: list[str] = []
    role: str = "Software Engineer"


class ReportBody(BaseModel):
    history: list[dict[str, Any]] = []
    role: str = "Software Engineer"
    skills: list[str] = []


class HRFeedbackBody(BaseModel):
    question: str
    answer: str
    category: str = "Behavioral"


@router.post("/start")
async def start_interview(body: StartBody):
    result = await mcp.call_tool("hr", "generate_interview_question", {
        "role": body.role,
        "skills": body.skills,
        "question_number": 1,
        "total_questions": 8,
        "resume_text": body.resumeText[:2000] if body.resumeText else "",
    })
    return {"success": True, "data": result}


@router.post("/evaluate")
async def evaluate_answer(body: EvaluateBody):
    is_last = body.questionNumber >= body.totalQuestions
    result = await mcp.call_tool("hr", "evaluate_interview_answer", {
        "question": body.question,
        "answer": body.answer,
        "category": body.category,
        "question_number": body.questionNumber,
        "total_questions": body.totalQuestions,
        "is_last": is_last,
        "role": body.role,
        "skills": body.skills,
    })
    return {"success": True, "data": result, "isLast": is_last}


@router.post("/report")
async def generate_report(body: ReportBody):
    result = await mcp.call_tool("hr", "generate_interview_report", {
        "history": body.history,
        "role": body.role,
        "skills": body.skills,
    })
    return {"success": True, "data": result}


@router.post("/hr-feedback")
async def hr_feedback(body: HRFeedbackBody):
    if not body.question or not body.answer:
        raise HTTPException(400, "question and answer are required")
    result = await mcp.call_tool("hr", "evaluate_hr_answer", {
        "question": body.question,
        "answer": body.answer,
        "category": body.category,
    })
    return {"success": True, "data": result}
