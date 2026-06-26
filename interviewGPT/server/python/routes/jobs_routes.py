from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from mcp_client import mcp

router = APIRouter(prefix="/jobs")


class AnalyzeBody(BaseModel):
    resumeText: str = ""
    targetRole: str = "Software Engineer"
    skills: list[str] = []


@router.post("/analyze")
async def analyze_job_fit(body: AnalyzeBody):
    if not body.resumeText and not body.skills:
        raise HTTPException(400, "Provide either resumeText or skills")

    result = await mcp.call_tool("job_analysis", "analyze_job_fit", {
        "resume_text": body.resumeText[:6000],
        "target_role": body.targetRole,
        "skills": body.skills,
    })
    return {"success": True, "data": result}
