"""Recommendation MCP Server — generates personalized learning roadmaps and study plans."""

import json
import os

from mcp.server.fastmcp import FastMCP

mcp = FastMCP("Recommendation MCP Server")

HAS_OPENAI = bool(os.environ.get("OPENAI_API_KEY"))

ROADMAPS = {
    "Software Engineer": {
        "technologies": ["TypeScript","React","Node.js","PostgreSQL","Docker","AWS","Redis","GraphQL"],
        "certifications": [
            {"name":"AWS Certified Developer – Associate","provider":"Amazon","url":"https://aws.amazon.com/certification/","reason":"Most in-demand cloud cert for developers"},
            {"name":"Google Cloud Professional Developer","provider":"Google","url":"https://cloud.google.com/certification","reason":"Strong for GCP-based companies"},
        ],
        "projects": [
            {"title":"Full-Stack SaaS App","description":"Multi-tenant web app with auth, payments, and dashboard","technologies":["React","Node.js","PostgreSQL","Stripe"],"github_topic":"fullstack"},
            {"title":"CLI Tool","description":"A developer productivity tool published to npm","technologies":["TypeScript","Node.js","Commander.js"],"github_topic":"cli-tool"},
        ],
        "topics": ["System Design","DSA","Distributed Systems","Database Optimization","CI/CD"],
    },
    "Data Scientist": {
        "technologies": ["Python","TensorFlow","PyTorch","Scikit-learn","Pandas","SQL","Spark","MLflow"],
        "certifications": [
            {"name":"TensorFlow Developer Certificate","provider":"Google","url":"https://www.tensorflow.org/certificate","reason":"Validates deep learning expertise"},
            {"name":"AWS Machine Learning Specialty","provider":"Amazon","url":"https://aws.amazon.com/certification/","reason":"Cloud ML deployment skills"},
        ],
        "projects": [
            {"title":"End-to-End ML Pipeline","description":"Feature engineering → training → serving with MLflow","technologies":["Python","MLflow","FastAPI","Docker"],"github_topic":"mlops"},
            {"title":"NLP Text Classifier","description":"Fine-tune a BERT model on a custom dataset","technologies":["Python","HuggingFace","PyTorch"],"github_topic":"nlp"},
        ],
        "topics": ["Statistics & Probability","Feature Engineering","Model Evaluation","MLOps","SQL for Analytics"],
    },
    "DevOps Engineer": {
        "technologies": ["Docker","Kubernetes","Terraform","Ansible","Jenkins","GitHub Actions","Prometheus","Grafana"],
        "certifications": [
            {"name":"CKA – Certified Kubernetes Administrator","provider":"CNCF","url":"https://www.cncf.io/certification/cka/","reason":"Most respected Kubernetes certification"},
            {"name":"HashiCorp Terraform Associate","provider":"HashiCorp","url":"https://www.hashicorp.com/certification/","reason":"Infrastructure as Code standard"},
        ],
        "projects": [
            {"title":"Kubernetes GitOps Pipeline","description":"Deploy a microservice app with ArgoCD and Helm","technologies":["Kubernetes","ArgoCD","Helm","GitHub Actions"],"github_topic":"gitops"},
            {"title":"Infrastructure as Code","description":"Provision a full cloud environment with Terraform","technologies":["Terraform","AWS","Ansible"],"github_topic":"terraform"},
        ],
        "topics": ["Kubernetes Internals","Service Mesh","Observability","Security (RBAC, secrets)","Cost Optimization"],
    },
}

PRACTICE_QUESTIONS = {
    "Technical": ["Explain the difference between process and thread", "What is eventual consistency?", "Design a rate limiter", "How does HTTPS work?"],
    "Behavioral": ["Tell me about a time you led a difficult project", "Describe a conflict you resolved", "How do you handle tight deadlines?"],
    "System Design": ["Design Twitter", "Design a URL shortener", "Design a notification system", "How would you scale a PostgreSQL database?"],
}


def _get_roadmap(target_role: str, weak_areas: list, skills: list) -> dict:
    role_data = ROADMAPS.get(target_role, ROADMAPS["Software Engineer"])
    existing = [s.lower() for s in skills]
    next_tech = [t for t in role_data["technologies"] if t.lower() not in existing][:5]

    learning_path = []
    if weak_areas:
        for area in weak_areas[:3]:
            learning_path.append({
                "week": f"Week {len(learning_path)+1}-{len(learning_path)+2}",
                "focus": area,
                "resources": [f"FreeCodeCamp {area} course", f"YouTube: Traversy Media {area}", f"Practice on LeetCode: {area} tag"],
                "milestone": f"Build a mini project using {area}",
            })
    else:
        for i, tech in enumerate(next_tech[:3], 1):
            learning_path.append({
                "week": f"Week {i*2-1}-{i*2}",
                "focus": tech,
                "resources": [f"Official {tech} docs", f"YouTube: Fireship {tech} in 100 seconds", f"Build a demo project"],
                "milestone": f"Add {tech} to your GitHub portfolio",
            })

    questions = (
        PRACTICE_QUESTIONS.get("System Design", []) +
        PRACTICE_QUESTIONS.get("Behavioral", []) +
        PRACTICE_QUESTIONS.get("Technical", [])
    )[:6]

    return {
        "target_role": target_role,
        "next_technologies": next_tech,
        "learning_path": learning_path,
        "certifications": role_data["certifications"],
        "recommended_projects": role_data["projects"],
        "study_topics": role_data["topics"],
        "practice_questions": questions,
        "weekly_plan": {
            "monday": "DSA practice (LeetCode 2 problems)",
            "tuesday": "System Design reading (1 chapter)",
            "wednesday": "Build project feature",
            "thursday": "Mock interview or behavioral prep",
            "friday": "Review week + push to GitHub",
            "weekend": "Deep dive into weakest skill area",
        },
        "resources": {
            "free": ["freeCodeCamp.org","roadmap.sh","CS50 on edX","The Odin Project"],
            "premium": ["Educative.io","AlgoExpert","System Design Interview book","Grokking Modern System Design"],
        },
    }


@mcp.tool()
async def generate_roadmap(
    skills: list, target_role: str, weak_areas: list,
    ats_score: int, interview_score: int, coding_score: int,
) -> str:
    """
    Generate a personalized learning roadmap based on current skills, target role, and weak areas.
    Returns technologies to learn, certifications, projects, weekly plan, and practice questions.
    """
    if HAS_OPENAI:
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])
            resp = await client.chat.completions.create(
                model="gpt-4o-mini", max_tokens=2000,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": 'Generate a personalized learning roadmap. Return JSON: {"target_role":"...","next_technologies":["t1"],"learning_path":[{"week":"Week 1-2","focus":"...","resources":["r1"],"milestone":"..."}],"certifications":[{"name":"...","provider":"...","url":"...","reason":"..."}],"recommended_projects":[{"title":"...","description":"...","technologies":["t1"]}],"study_topics":["s1"],"practice_questions":["q1"],"weekly_plan":{"monday":"..."},"resources":{"free":["f1"],"premium":["p1"]}}'},
                    {"role": "user", "content": f"Role: {target_role}\nSkills: {', '.join(skills)}\nWeak areas: {', '.join(weak_areas)}\nScores — ATS:{ats_score}, Interview:{interview_score}, Coding:{coding_score}"}
                ]
            )
            return resp.choices[0].message.content
        except Exception:
            pass

    return json.dumps(_get_roadmap(target_role, weak_areas, skills))


if __name__ == "__main__":
    mcp.run()
