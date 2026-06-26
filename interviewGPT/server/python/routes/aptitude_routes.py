from typing import Any
from fastapi import APIRouter
from pydantic import BaseModel
from mcp_client import mcp

router = APIRouter(prefix="/aptitude")

QUESTIONS: dict[str, list] = {
  "Quantitative": [
    {"id":1,"question":"A train travels 360 km in 4 hours. What is its speed in km/h?","options":["80","90","100","120"],"answer":1,"explanation":"Speed = Distance/Time = 360/4 = 90 km/h"},
    {"id":2,"question":"If 15% of a number is 75, what is the number?","options":["400","450","500","550"],"answer":2,"explanation":"15% × x = 75 → x = 500"},
    {"id":3,"question":"A shopkeeper buys for ₹800, sells for ₹1000. Profit %?","options":["20%","25%","30%","15%"],"answer":1,"explanation":"Profit% = (200/800) × 100 = 25%"},
    {"id":4,"question":"Pipes A and B fill a tank in 12 and 18 hrs. Together?","options":["6 hours","7 hours","7.2 hours","8 hours"],"answer":2,"explanation":"Combined rate = 1/12+1/18=5/36, Time=7.2 hrs"},
    {"id":5,"question":"Compound interest on ₹5000 at 10% p.a. for 2 years?","options":["₹1000","₹1025","₹1050","₹1100"],"answer":2,"explanation":"CI = 5000×[(1.1)²-1] = ₹1050"},
    {"id":6,"question":"A:B = 3:5 and B:C = 2:3. What is A:B:C?","options":["3:5:6","6:10:15","3:5:7","9:15:10"],"answer":1,"explanation":"A:B:C = 6:10:15"},
    {"id":7,"question":"Boat: 40 km upstream in 5 hrs, 40 km downstream in 4 hrs. Still water speed?","options":["8 km/h","9 km/h","10 km/h","11 km/h"],"answer":1,"explanation":"(8+10)/2 = 9 km/h"},
    {"id":8,"question":"Average of 5 numbers is 25. Remove one, average = 24. Removed number?","options":["28","29","30","31"],"answer":1,"explanation":"Total=125, After=96, Removed=29"},
  ],
  "Logical": [
    {"id":101,"question":"All Bloops are Razzies. All Razzies are Lazzies. Are all Bloops Lazzies?","options":["Yes","No","Cannot determine","Sometimes"],"answer":0,"explanation":"Transitive: Bloops→Razzies→Lazzies."},
    {"id":102,"question":"Find the missing number: 2, 6, 12, 20, 30, ?","options":["40","42","44","46"],"answer":1,"explanation":"Pattern n×(n+1): 6×7=42"},
    {"id":103,"question":"A is father of B. B is sister of C. C is mother of D. A is related to D as?","options":["Father","Grandfather","Uncle","Granduncle"],"answer":1,"explanation":"A is D's grandfather"},
    {"id":104,"question":"If CLOUD is coded as DNPVF, how is RAIN coded?","options":["SBJP","SBJO","TCJP","TBKP"],"answer":1,"explanation":"+1 shift: R→S,A→B,I→J,N→O = SBJO"},
    {"id":105,"question":"Odd one out: 16, 25, 36, 49, 56, 64","options":["36","49","56","64"],"answer":2,"explanation":"56 is not a perfect square"},
    {"id":106,"question":"Complete: AZ, BY, CX, DW, ?","options":["EV","EW","FV","EU"],"answer":0,"explanation":"Ascending + descending pattern → EV"},
    {"id":107,"question":"6 people in a row. A and B must be together. Arrangements?","options":["120","240","360","480"],"answer":1,"explanation":"5!×2 = 240"},
    {"id":108,"question":"Some cats are dogs. All dogs are animals. Conclusion: Some cats are animals?","options":["Valid","Invalid","Partially valid","Cannot say"],"answer":0,"explanation":"Transitive logic: Valid."},
  ],
  "Verbal": [
    {"id":201,"question":"Word most similar to 'CANDID':","options":["Harsh","Honest","Secretive","Diplomatic"],"answer":1,"explanation":"Candid = truthful"},
    {"id":202,"question":"Word most opposite to 'BENEVOLENT':","options":["Kind","Generous","Malevolent","Charitable"],"answer":2,"explanation":"Antonym of benevolent is malevolent"},
    {"id":203,"question":"Select the correctly spelled word:","options":["Accomodation","Acommodation","Accommodation","Acomodation"],"answer":2,"explanation":"Accommodation (double c, double m)"},
    {"id":204,"question":"The committee _____ the proposal unanimously.","options":["accepted","excepted","acceped","excepts"],"answer":0,"explanation":"Accepted = approved"},
    {"id":205,"question":"Grammatically correct sentence:","options":["He don't know","She have finished","They are playing cricket","I goes to school"],"answer":2,"explanation":"They are playing cricket is correct"},
    {"id":206,"question":"One who walks in sleep:","options":["Sadist","Somnambulism","Somnambulist","Narcissist"],"answer":2,"explanation":"Somnambulist"},
    {"id":207,"question":"Synonym of 'EPHEMERAL':","options":["Eternal","Transient","Permanent","Enduring"],"answer":1,"explanation":"Ephemeral = Transient"},
    {"id":208,"question":"Idiom for 'face a difficult situation bravely':","options":["Bite the bullet","Bite the hand","Bite off more","Bite the dust"],"answer":0,"explanation":"Bite the bullet = endure bravely"},
  ],
  "Data Interpretation": [
    {"id":301,"question":"Sales: Q1=₹2L, Q2=₹3L, Q3=₹2.5L, Q4=₹4L. Average quarterly?","options":["₹2.5L","₹2.75L","₹3L","₹2.875L"],"answer":3,"explanation":"Average = 11.5/4 = ₹2.875L"},
    {"id":302,"question":"Employees: 2022=500, 2023=650. Percentage increase?","options":["25%","28%","30%","32%"],"answer":2,"explanation":"(150/500)×100 = 30%"},
    {"id":303,"question":"Pie: IT=35%, Total=200. IT employees?","options":["60","65","70","75"],"answer":2,"explanation":"0.35×200 = 70"},
    {"id":304,"question":"Marks: Maths 85, Science 72, English 68, History 90. Range?","options":["18","20","22","25"],"answer":2,"explanation":"90-68 = 22"},
  ],
}


class SubmitBody(BaseModel):
    category: str
    answers: list[dict[str, Any]]


@router.get("/questions")
async def get_questions(category: str = "Quantitative", count: int = 5):
    qs = QUESTIONS.get(category, QUESTIONS["Quantitative"])
    import random
    selected = random.sample(qs, min(count, len(qs)))
    return {"success": True, "data": selected, "category": category}


@router.get("/categories")
async def get_categories():
    return {"success": True, "data": list(QUESTIONS.keys())}


@router.post("/submit")
async def submit_answers(body: SubmitBody):
    result = await mcp.call_tool("aptitude", "evaluate_aptitude_answers", {
        "category": body.category,
        "answers": body.answers,
        "questions": QUESTIONS.get(body.category, []),
    })
    return {"success": True, "data": result}
