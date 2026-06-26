import io
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from auth import get_current_user
from mcp_client import mcp

router = APIRouter(prefix="/resume")

ALLOWED_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
}


def extract_pdf_text(content: bytes) -> str:
    try:
        import pdfplumber
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            return "\n".join(p.extract_text() or "" for p in pdf.pages)
    except Exception as e:
        raise HTTPException(422, f"Could not parse PDF: {e}")


def extract_docx_text(content: bytes) -> str:
    try:
        import docx
        doc = docx.Document(io.BytesIO(content))
        return "\n".join(p.text for p in doc.paragraphs)
    except Exception as e:
        raise HTTPException(422, f"Could not parse DOCX: {e}")


@router.post("/analyze")
async def analyze_resume(
    resume: UploadFile = File(...),
    _=Depends(get_current_user),
):
    if resume.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, "Only PDF and DOCX files are supported")

    content = await resume.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(400, "File too large (max 10 MB)")

    if "pdf" in (resume.content_type or ""):
        text = extract_pdf_text(content)
    else:
        text = extract_docx_text(content)

    text = text.strip()
    if not text:
        raise HTTPException(422, "The file appears empty or is image-only (scanned PDF).")

    result = await mcp.call_tool(
        "resume", "analyze_resume",
        {"resume_text": text[:8000], "file_name": resume.filename or "resume"},
    )
    return {"success": True, "data": result}
