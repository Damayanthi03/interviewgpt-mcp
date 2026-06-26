"""Job Analysis MCP Server — analyzes resume-to-job fit, recommends roles, generates job links."""

import json
import os
import re
from urllib.parse import quote_plus

from mcp.server.fastmcp import FastMCP

mcp = FastMCP("Job Analysis MCP Server")

HAS_OPENAI = bool(os.environ.get("OPENAI_API_KEY"))

ROLE_SKILLS = {
    "Software Engineer": ["Python","Java","JavaScript","Data Structures","Algorithms","Git","SQL","REST APIs","System Design"],
    "Frontend Developer": ["React","JavaScript","TypeScript","CSS","HTML","Next.js","Performance","Accessibility","Redux"],
    "Backend Developer": ["Node.js","Python","Java","PostgreSQL","Redis","Docker","REST APIs","Microservices","Authentication"],
    "Full Stack Developer": ["React","Node.js","PostgreSQL","Docker","TypeScript","REST APIs","Git","Cloud","Testing"],
    "Data Scientist": ["Python","Machine Learning","Deep Learning","SQL","TensorFlow","PyTorch","Statistics","Pandas","Data Visualization"],
    "DevOps Engineer": ["Docker","Kubernetes","CI/CD","Terraform","AWS","Linux","Shell Scripting","Monitoring","Git"],
    "Product Manager": ["Product Roadmap","Agile","User Research","A/B Testing","Analytics","Stakeholder Management","Go-to-Market","OKRs"],
    "ML Engineer": ["Python","TensorFlow","PyTorch","MLOps","Docker","Kubernetes","Feature Engineering","Model Deployment","SQL"],
}


def _job_search_links(role: str) -> dict:
    kw = quote_plus(role)
    return {
        "linkedin": f"https://www.linkedin.com/jobs/search/?keywords={kw}",
        "indeed": f"https://www.indeed.com/jobs?q={kw}",
        "naukri": f"https://www.naukri.com/{kw.lower().replace('+', '-')}-jobs",
        "wellfound": f"https://wellfound.com/jobs?q={kw}",
    }


def _demo_analyze(resume_text: str, target_role: str, skills: list) -> dict:
    t = resume_text.lower()
    required = ROLE_SKILLS.get(target_role, ROLE_SKILLS["Software Engineer"])

    if skills:
        candidate_skills = skills
    else:
        candidate_skills = [s for s in sum(ROLE_SKILLS.values(), []) if s.lower() in t]
        candidate_skills = list(dict.fromkeys(candidate_skills))[:15]

    matched = [s for s in required if any(s.lower() in cs.lower() or cs.lower() in s.lower() for cs in candidate_skills)]
    missing = [s for s in required if s not in matched]
    match_pct = round((len(matched) / len(required)) * 100) if required else 60

    # Recommend alternative roles
    alt_roles = []
    for role, role_skills in ROLE_SKILLS.items():
        if role == target_role:
            continue
        m = sum(1 for s in role_skills if any(s.lower() in cs.lower() for cs in candidate_skills))
        pct = round((m / len(role_skills)) * 100)
        if pct >= 40:
            alt_roles.append({"role": role, "match_percentage": pct, "search_links": _job_search_links(role)})
    alt_roles.sort(key=lambda x: -x["match_percentage"])

    exp_years = len(re.findall(r'\d+\s*(?:year|yr)s?\s*(?:of)?\s*experience', t, re.I))
    has_exp = bool(re.search(r'experience|worked|employed|internship', t))
    has_proj = bool(re.search(r'project|built|developed', t))

    return {
        "target_role": target_role,
        "match_percentage": match_pct,
        "matched_skills": matched,
        "missing_skills": missing,
        "candidate_skills": candidate_skills,
        "experience_years": exp_years if exp_years > 0 else (2 if has_exp else 0),
        "has_relevant_projects": has_proj,
        "recommended_roles": alt_roles[:4],
        "search_links": _job_search_links(target_role),
        "gap_analysis": f"You match {match_pct}% of skills required for {target_role}. {'Strong fit!' if match_pct >= 75 else 'Focus on closing these gaps: ' + ', '.join(missing[:3]) + '.'}",
        "action_plan": [
            f"Learn {missing[0]} — take a course on Coursera or Udemy." if missing else "Keep your existing skills sharp.",
            f"Build a project using {missing[1]} to demonstrate the skill." if len(missing) > 1 else "Add more projects to your portfolio.",
            "Update your resume with quantified achievements for each role.",
            f"Apply now: {_job_search_links(target_role)['linkedin']}",
        ],
    }


@mcp.tool()
async def analyze_job_fit(resume_text: str, target_role: str, skills: list) -> str:
    """
    Analyze how well a candidate's resume/skills match a target job role.
    Returns match percentage, matched/missing skills, recommended roles, and job search links.
    """
    if HAS_OPENAI:
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])
            resp = await client.chat.completions.create(
                model="gpt-4o-mini", max_tokens=1500,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": f'Analyze job fit. Return JSON: {{"target_role":"...","match_percentage":<0-100>,"matched_skills":["s1"],"missing_skills":["s2"],"candidate_skills":["s3"],"recommended_roles":[{{"role":"...","match_percentage":80}}],"gap_analysis":"...","action_plan":["a1","a2","a3"]}}'},
                    {"role": "user", "content": f"Role: {target_role}\nSkills: {', '.join(skills)}\nResume: {resume_text[:4000]}"}
                ]
            )
            data = json.loads(resp.choices[0].message.content)
            # Enrich recommended roles with search links
            for r in data.get("recommended_roles", []):
                r["search_links"] = _job_search_links(r.get("role", target_role))
            data["search_links"] = _job_search_links(target_role)
            return json.dumps(data)
        except Exception:
            pass

    return json.dumps(_demo_analyze(resume_text, target_role, skills))


if __name__ == "__main__":
    mcp.run()
