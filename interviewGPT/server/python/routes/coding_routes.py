import subprocess
from typing import Any
from fastapi import APIRouter
from pydantic import BaseModel
from mcp_client import mcp

router = APIRouter(prefix="/coding")

PROBLEMS = [
  {"id":1,"title":"Two Sum","difficulty":"Easy","topic":"Arrays","description":"Given an integer array nums and a target integer, return indices of the two numbers that add up to target.","examples":[{"input":"nums=[2,7,11,15], target=9","output":"[0,1]"}],"constraints":["2 <= nums.length <= 10^4","-10^9 <= nums[i] <= 10^9"],"starter":{"python":"def twoSum(nums, target):\n    # Your solution here\n    pass","javascript":"function twoSum(nums, target) {\n    // Your solution here\n}","java":"class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Your solution here\n    }\n}"}},
  {"id":2,"title":"Reverse String","difficulty":"Easy","topic":"Strings","description":"Write a function that reverses a string. The input string is given as an array of characters s.","examples":[{"input":'s=["h","e","l","l","o"]',"output":'["o","l","l","e","h"]'}],"constraints":["1 <= s.length <= 10^5"],"starter":{"python":"def reverseString(s):\n    # Modify in-place\n    pass","javascript":"function reverseString(s) {\n    // Modify in-place\n}","java":"class Solution {\n    public void reverseString(char[] s) {\n        // Modify in-place\n    }\n}"}},
  {"id":3,"title":"Valid Parentheses","difficulty":"Easy","topic":"Strings","description":"Given a string s containing '(', ')', '{', '}', '[' and ']', determine if the input string is valid.","examples":[{"input":'s="()"',"output":"true"},{"input":'s="(]"',"output":"false"}],"constraints":["1 <= s.length <= 10^4"],"starter":{"python":"def isValid(s):\n    pass","javascript":"function isValid(s) {\n}","java":"class Solution {\n    public boolean isValid(String s) {\n    }\n}"}},
  {"id":4,"title":"Maximum Subarray","difficulty":"Medium","topic":"Arrays","description":"Given an integer array nums, find the subarray with the largest sum and return its sum.","examples":[{"input":"nums=[-2,1,-3,4,-1,2,1,-5,4]","output":"6"}],"constraints":["1 <= nums.length <= 10^5"],"starter":{"python":"def maxSubArray(nums):\n    # Kadane's algorithm\n    pass","javascript":"function maxSubArray(nums) {\n}","java":"class Solution {\n    public int maxSubArray(int[] nums) {\n    }\n}"}},
  {"id":5,"title":"Binary Search","difficulty":"Easy","topic":"Searching","description":"Given a sorted array nums and a target, return the index of target or -1.","examples":[{"input":"nums=[-1,0,3,5,9,12], target=9","output":"4"}],"constraints":["1 <= nums.length <= 10^4"],"starter":{"python":"def search(nums, target):\n    pass","javascript":"function search(nums, target) {\n}","java":"class Solution {\n    public int search(int[] nums, int target) {\n    }\n}"}},
  {"id":6,"title":"Climbing Stairs","difficulty":"Easy","topic":"DP","description":"You can climb 1 or 2 steps. How many distinct ways can you climb n steps?","examples":[{"input":"n=2","output":"2"},{"input":"n=3","output":"3"}],"constraints":["1 <= n <= 45"],"starter":{"python":"def climbStairs(n):\n    pass","javascript":"function climbStairs(n) {\n}","java":"class Solution {\n    public int climbStairs(int n) {\n    }\n}"}},
  {"id":7,"title":"Merge Two Sorted Lists","difficulty":"Easy","topic":"Sorting","description":"Merge two sorted linked lists and return the merged list.","examples":[{"input":"list1=[1,2,4], list2=[1,3,4]","output":"[1,1,2,3,4,4]"}],"constraints":["0 <= number of nodes <= 50"],"starter":{"python":"def mergeTwoLists(list1, list2):\n    pass","javascript":"function mergeTwoLists(list1, list2) {\n}","java":"class Solution {\n    public ListNode mergeTwoLists(ListNode list1, ListNode list2) {\n    }\n}"}},
  {"id":8,"title":"Number of Islands","difficulty":"Medium","topic":"Graphs","description":"Given a binary grid, return the number of islands.","examples":[{"input":'grid=[["1","1","0"],["1","1","0"],["0","0","1"]]',"output":"2"}],"constraints":["1 <= m, n <= 300"],"starter":{"python":"def numIslands(grid):\n    pass","javascript":"function numIslands(grid) {\n}","java":"class Solution {\n    public int numIslands(char[][] grid) {\n    }\n}"}},
  {"id":9,"title":"Longest Common Subsequence","difficulty":"Medium","topic":"DP","description":"Return the length of the longest common subsequence of text1 and text2.","examples":[{"input":'text1="abcde", text2="ace"',"output":"3"}],"constraints":["1 <= text1.length, text2.length <= 1000"],"starter":{"python":"def longestCommonSubsequence(text1, text2):\n    pass","javascript":"function longestCommonSubsequence(text1, text2) {\n}","java":"class Solution {\n    public int longestCommonSubsequence(String text1, String text2) {\n    }\n}"}},
  {"id":10,"title":"Course Schedule","difficulty":"Medium","topic":"Graphs","description":"Return true if you can finish all numCourses given prerequisites.","examples":[{"input":"numCourses=2, prerequisites=[[1,0]]","output":"true"}],"constraints":["1 <= numCourses <= 2000"],"starter":{"python":"def canFinish(numCourses, prerequisites):\n    pass","javascript":"function canFinish(numCourses, prerequisites) {\n}","java":"class Solution {\n    public boolean canFinish(int numCourses, int[][] prerequisites) {\n    }\n}"}},
  {"id":11,"title":"Word Break","difficulty":"Medium","topic":"DP","description":"Return true if s can be segmented using words in wordDict.","examples":[{"input":'s="leetcode", wordDict=["leet","code"]',"output":"true"}],"constraints":["1 <= s.length <= 300"],"starter":{"python":"def wordBreak(s, wordDict):\n    pass","javascript":"function wordBreak(s, wordDict) {\n}","java":"class Solution {\n    public boolean wordBreak(String s, List<String> wordDict) {\n    }\n}"}},
  {"id":12,"title":"Trapping Rain Water","difficulty":"Hard","topic":"Arrays","description":"Given elevation heights, compute how much water it can trap after raining.","examples":[{"input":"height=[0,1,0,2,1,0,1,3,2,1,2,1]","output":"6"}],"constraints":["1 <= n <= 2*10^4"],"starter":{"python":"def trap(height):\n    pass","javascript":"function trap(height) {\n}","java":"class Solution {\n    public int trap(int[] height) {\n    }\n}"}},
]


class ExecuteBody(BaseModel):
    code: str
    language: str = "python"


class EvaluateBody(BaseModel):
    code: str
    language: str = "python"
    problemId: int = 1
    problemTitle: str = ""
    problemDescription: str = ""


@router.post("/execute")
async def execute_code(body: ExecuteBody):
    code = body.code
    language = body.language
    try:
        if language == "python":
            result = subprocess.run(
    ["python", "-c", code],
    capture_output=True,
    text=True,
    timeout=10
)
        elif language == "javascript":
            result = subprocess.run(
                ["node", "-e", code],
                capture_output=True, text=True, timeout=10
            )
        elif language == "java":
            return {"success": True, "data": {
                "stdout": "",
                "stderr": "Java execution is not available. Use the Evaluate button for AI feedback.",
                "exitCode": 0
            }}
        else:
            return {"success": False, "error": f"Unsupported language: {language}"}
        return {"success": True, "data": {
            "stdout": result.stdout,
            "stderr": result.stderr,
            "exitCode": result.returncode
        }}
    except subprocess.TimeoutExpired:
        return {"success": True, "data": {
            "stdout": "",
            "stderr": "Execution timed out (10s limit exceeded)",
            "exitCode": 1
        }}
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.get("/problems")
async def get_problems(difficulty: str = "", topic: str = ""):
    problems = PROBLEMS
    if difficulty and difficulty != "All":
        problems = [p for p in problems if p["difficulty"] == difficulty]
    if topic and topic != "All":
        problems = [p for p in problems if p["topic"] == topic]
    return {"success": True, "data": [
        {"id": p["id"], "title": p["title"], "difficulty": p["difficulty"], "topic": p["topic"]}
        for p in problems
    ]}


@router.get("/problem/{pid}")
async def get_problem(pid: int):
    problem = next((p for p in PROBLEMS if p["id"] == pid), None)
    if not problem:
        from fastapi import HTTPException
        raise HTTPException(404, "Problem not found")
    return {"success": True, "data": problem}


@router.post("/evaluate")
async def evaluate_code(body: EvaluateBody):
    result = await mcp.call_tool("coding", "evaluate_code", {
        "code": body.code,
        "language": body.language,
        "problem_id": body.problemId,
        "problem_title": body.problemTitle,
        "problem_description": body.problemDescription,
    })
    return {"success": True, "data": result}


@router.post("/generate-question")
async def generate_question(body: dict[str, Any] = {}):
    result = await mcp.call_tool("coding", "generate_coding_question", {
        "difficulty": body.get("difficulty", "Medium"),
        "topic": body.get("topic", "Arrays"),
        "role": body.get("role", "Software Engineer"),
    })
    return {"success": True, "data": result}
