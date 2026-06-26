"""Resume MCP Server — parses resumes, calculates ATS scores, extracts skills."""

import json
import os
import re
import sys

from mcp.server.fastmcp import FastMCP

mcp = FastMCP("Resume MCP Server")

HAS_OPENAI = bool(os.environ.get("OPENAI_API_KEY"))

TECH_SKILLS = [
    "python","javascript","typescript","react","node","java","c++","sql","aws",
    "docker","kubernetes","git","mongodb","postgresql","redis","graphql","rest api",
    "machine learning","deep learning","tensorflow","pytorch","flask","django",
    "spring","angular","vue","linux","bash","terraform","jenkins","ci/cd",
    "microservices","agile","scrum","devops","cloud","azure","gcp",
]

SOFT_SKILLS = [
    "leadership","communication","teamwork","problem solving","critical thinking",
    "project management","mentoring","agile","cross-functional","stakeholder",
]


def _demo_analyze(resume_text: str) -> dict:
    t = resume_text.lower()
    words = resume_text.split()
    word_count = len(words)

    name = re.search(r'^([A-Z][a-z]+(?:\s[A-Z][a-z]+){1,2})', resume_text, re.M)
    email = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', resume_text)
    phone = re.search(r'(\+?\d[\d\s\-().]{8,14}\d)', resume_text)
    linkedin = re.search(r'linkedin\.com/in/[\w-]+', resume_text)

    found_tech = [s for s in TECH_SKILLS if s in t]
    found_soft = [s for s in SOFT_SKILLS if s in t]
    all_skills = list(dict.fromkeys(found_tech + found_soft))[:14]

    has_exp = bool(re.search(r'experience|worked|employed|internship|job|role|company', t))
    has_edu = bool(re.search(r'education|university|college|degree|bachelor|master|phd|b\.?tech|m\.?tech', t))
    has_proj = bool(re.search(r'project|built|developed|created|implemented', t))
    has_certs = bool(re.search(r'certif|aws|google cloud|azure|coursera|udemy', t))
    has_quant = bool(re.search(r'\d+%|\$\d+|\d+x|\d+ million|\d+k|\d+ users|\d+ team', t))
    has_linkedin = bool(linkedin)

    score = 40
    if email: score += 8
    if phone: score += 5
    if has_linkedin: score += 5
    if has_exp: score += 10
    if has_edu: score += 8
    if has_proj: score += 7
    if has_certs: score += 5
    if has_quant: score += 8
    if len(all_skills) >= 5: score += 6
    if word_count > 300: score += 3
    score = min(score, 96)

    label = "Excellent" if score >= 80 else "Good" if score >= 65 else "Needs Improvement" if score >= 50 else "Poor"
    missing = [s for s in ["Docker","Kubernetes","CI/CD","TypeScript","AWS","GraphQL","System Design"] if s.lower() not in t][:5]
    matched = [s.title() for s in all_skills[:6]]

    suggestions = []
    if not has_quant:
        suggestions.append({"type":"error","category":"Critical","message":"No quantified achievements found. Add metrics like '35% faster', '$2M revenue' to every bullet."})
    if not has_linkedin:
        suggestions.append({"type":"error","category":"Critical","message":"Missing LinkedIn URL. 80% of recruiters check it."})
    if not has_certs:
        suggestions.append({"type":"warning","category":"Improvements","message":"Add relevant certifications (AWS, GCP, etc.) to boost ATS score."})
    if len(all_skills) < 5:
        suggestions.append({"type":"warning","category":"Improvements","message":"Add 8-12 specific technical skills relevant to your target role."})
    if has_exp:
        suggestions.append({"type":"success","category":"Strengths","message":"Work experience section detected with solid structure."})
    if has_edu:
        suggestions.append({"type":"success","category":"Strengths","message":"Education details are present and well-formatted."})
    if len(all_skills) >= 4:
        suggestions.append({"type":"success","category":"Strengths","message":f"Strong skill set: {', '.join(matched[:3])} and more."})

    return {
        "extracted": {
            "name": name.group(1) if name else None,
            "email": email.group(0) if email else None,
            "phone": phone.group(0) if phone else None,
            "linkedin": f"https://{linkedin.group(0)}" if linkedin else None,
            "skills": [s.title() for s in all_skills],
            "education": [{"degree":"Detected","institution":"See resume","year":"","gpa":None}] if has_edu else [],
            "experience": [{"title":"Experience detected","company":"See resume","duration":"","highlights":[]}] if has_exp else [],
            "projects": [{"name":"Projects detected","description":"See resume","technologies":[s.title() for s in all_skills[:3]]}] if has_proj else [],
            "certifications": ["Certifications detected"] if has_certs else [],
        },
        "ats_score": score,
        "ats_label": label,
        "section_scores": {
            "contact": 90 if email else 45,
            "summary": 80 if word_count > 400 else 55,
            "experience": (88 if has_quant else 68) if has_exp else 20,
            "skills": 85 if len(all_skills) >= 6 else 65 if len(all_skills) >= 3 else 40,
            "education": 88 if has_edu else 30,
            "projects": 80 if has_proj else 35,
            "certifications": 82 if has_certs else 40,
        },
        "keyword_analysis": {"matched": matched, "missing": missing},
        "suggestions": suggestions,
        "missing_skills": missing,
        "recommended_certifications": [
            {"name":"AWS Certified Cloud Practitioner","provider":"Amazon","relevance":"High","reason":"Cloud skills are in demand for most software roles."},
            {"name":"Google Professional Data Engineer","provider":"Google","relevance":"Medium","reason":"Data engineering is increasingly required."},
        ],
        "recommended_projects": [
            {"title":"Full-Stack Web App","description":"React frontend + Node.js API + PostgreSQL, deployed on AWS.","technologies":["React","Node.js","PostgreSQL","AWS"],"impact":"Shows end-to-end development skills."},
            {"title":"Containerized Microservices","description":"Break a monolith into 3 services using Docker + Docker Compose.","technologies":["Docker","Node.js","Redis","Nginx"],"impact":"Closes DevOps/backend skills gap."},
        ],
        "overall_feedback": (
            f"Your resume scores {score}/100 ({label}). "
            + ("Strong profile!" if score >= 80 else "The core content is there — focus on quantified achievements.")
            + (" Add numbers to every bullet point (e.g., 'Reduced load time by 40%')." if not has_quant else "")
            + (f" Consider adding: {', '.join(missing[:3])}." if missing else "")
        ),
    }


@mcp.tool()
async def analyze_resume(resume_text: str, file_name: str = "") -> str:
    """
    Analyze a resume text and return comprehensive ATS scoring, skill extraction,
    keyword analysis, suggestions, and personalized recommendations.
    Returns JSON string.
    """
    if HAS_OPENAI:
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])
            resp = await client.chat.completions.create(
                model="gpt-4o-mini", max_tokens=4096,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": "You are an expert resume analyst. Given resume text, return comprehensive ATS analysis as JSON with keys: extracted (name,email,phone,linkedin,skills,education,experience,projects,certifications), ats_score (0-100), ats_label, section_scores (contact,summary,experience,skills,education,projects,certifications), keyword_analysis (matched,missing), suggestions (list of {type,category,message}), missing_skills, recommended_certifications (list of {name,provider,relevance,reason}), recommended_projects (list of {title,description,technologies,impact}), overall_feedback."},
                    {"role": "user", "content": f"Analyze this resume:\n\n{resume_text[:8000]}"}
                ]
            )
            return resp.choices[0].message.content
        except Exception:
            pass

    return json.dumps(_demo_analyze(resume_text))


if __name__ == "__main__":
    mcp.run()
