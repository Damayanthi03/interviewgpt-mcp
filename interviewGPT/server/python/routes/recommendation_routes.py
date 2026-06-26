from fastapi import APIRouter
from pydantic import BaseModel
from mcp_client import mcp

router = APIRouter(prefix="/recommendation")


class RoadmapBody(BaseModel):
    skills: list[str] = []
    targetRole: str = "Software Engineer"
    weakAreas: list[str] = []
    atsScore: int = 0
    interviewScore: int = 0
    codingScore: int = 0


@router.post("/roadmap")
async def generate_roadmap(body: RoadmapBody):
    result = await mcp.call_tool("recommendation", "generate_roadmap", {
        "skills": body.skills,
        "target_role": body.targetRole,
        "weak_areas": body.weakAreas,
        "ats_score": body.atsScore,
        "interview_score": body.interviewScore,
        "coding_score": body.codingScore,
    })
    return {"success": True, "data": result}
