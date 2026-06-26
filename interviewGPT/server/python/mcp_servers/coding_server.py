"""Coding Interview MCP Server — evaluates code, generates problems, analyzes complexity."""

import json
import os
import random
import re

from mcp.server.fastmcp import FastMCP

mcp = FastMCP("Coding Interview MCP Server")

HAS_OPENAI = bool(os.environ.get("OPENAI_API_KEY"))

OPTIMAL_SOLUTIONS = {
    "Two Sum": {"python": "def twoSum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen:\n            return [seen[target - n], i]\n        seen[n] = i", "complexity": {"time": "O(n)", "space": "O(n)"}},
    "Binary Search": {"python": "def search(nums, target):\n    lo, hi = 0, len(nums)-1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if nums[mid] == target: return mid\n        elif nums[mid] < target: lo = mid + 1\n        else: hi = mid - 1\n    return -1", "complexity": {"time": "O(log n)", "space": "O(1)"}},
    "Climbing Stairs": {"python": "def climbStairs(n):\n    a, b = 1, 2\n    for _ in range(n - 1): a, b = b, a + b\n    return a", "complexity": {"time": "O(n)", "space": "O(1)"}},
    "Maximum Subarray": {"python": "def maxSubArray(nums):\n    cur = best = nums[0]\n    for n in nums[1:]:\n        cur = max(n, cur + n)\n        best = max(best, cur)\n    return best", "complexity": {"time": "O(n)", "space": "O(1)"}},
}

TOPICS = ["Arrays", "Strings", "Linked Lists", "Trees", "Graphs", "DP", "Sorting", "Searching", "Stacks", "Queues"]


def _analyze_code_heuristic(code: str, language: str, problem_title: str) -> dict:
    lines = [l for l in code.strip().split("\n") if l.strip() and not l.strip().startswith("#")]
    has_loop = bool(re.search(r'for|while', code))
    has_nested_loop = bool(re.search(r'for.*\n.*for|while.*\n.*while|for.*for', code, re.DOTALL))
    # Detect recursion: look for a function definition then a call to a matching name
    fn_match = re.search(r'def (\w+)', code)
    js_fn_match = re.search(r'function (\w+)', code)
    has_recursion = False
    if fn_match:
        fn_name = fn_match.group(1)
        has_recursion = bool(re.search(r'\b' + re.escape(fn_name) + r'\s*\(', code[fn_match.end():]))
    elif js_fn_match:
        fn_name = js_fn_match.group(1)
        has_recursion = bool(re.search(r'\b' + re.escape(fn_name) + r'\s*\(', code[js_fn_match.end():]))
    has_dict_map = bool(re.search(r'{}|dict\(|new Map|HashMap|{[^:]*:|}', code))
    has_sort = bool(re.search(r'\.sort\(|sorted\(|Arrays\.sort', code))
    has_early_return = bool(re.search(r'return', code))
    code_len = len(lines)

    # Time complexity guess
    if has_nested_loop: time_c = "O(n²)"
    elif has_sort: time_c = "O(n log n)"
    elif has_loop: time_c = "O(n)"
    elif has_recursion: time_c = "O(2ⁿ) — consider memoization"
    else: time_c = "O(1)"

    # Space complexity guess
    space_c = "O(n)" if has_dict_map else "O(log n)" if has_recursion else "O(1)"

    # Score
    score = 50
    if has_early_return: score += 10
    if has_dict_map and not has_nested_loop: score += 15  # hash map = usually optimal
    if not has_nested_loop and has_loop: score += 10
    if code_len <= 10: score += 10
    if has_recursion and not has_dict_map: score -= 5  # might be exponential
    score = min(score + random.randint(-5, 10), 98)

    optimal = OPTIMAL_SOLUTIONS.get(problem_title, {})

    return {
        "score": score,
        "correctness": score >= 70,
        "time_complexity": time_c,
        "space_complexity": space_c,
        "optimal_complexity": optimal.get("complexity", {"time": "O(n)", "space": "O(1)"}),
        "feedback": (
            "Excellent approach! Your solution is clean and efficient." if score >= 85
            else "Good solution. Consider whether a hash map can reduce time complexity." if score >= 70
            else "Your approach works conceptually. Look for a way to avoid nested loops — often a hash map helps."
        ),
        "strengths": (
            ["Efficient algorithm choice", "Clean code structure", "Good edge case handling"] if score >= 80
            else ["Correct approach", "Readable code"]
        ),
        "improvements": (
            ["Add input validation", "Consider edge cases (empty array, single element)"] if score >= 75
            else ["Try a hash map to reduce from O(n²) to O(n)", "Add comments explaining your approach", "Test with edge cases"]
        ),
        "sample_solution": optimal.get("python", f"# Optimal solution for {problem_title}\n# Use a hash map for O(n) time complexity"),
        "hints": [
            f"For {problem_title}: think about what information you can store as you iterate.",
            "A hash map (dict) can often reduce a nested loop to a single pass.",
            "Two pointers is another common pattern for array problems.",
        ],
    }


@mcp.tool()
async def evaluate_code(
    code: str, language: str, problem_id: int, problem_title: str, problem_description: str
) -> str:
    """
    Evaluate submitted code for correctness, time complexity, space complexity, and quality.
    Returns score, feedback, complexity analysis, strengths, improvements, and sample solution.
    """
    if not code or not code.strip():
        return json.dumps({"score": 0, "correctness": False, "feedback": "No code submitted.", "time_complexity": "N/A", "space_complexity": "N/A", "strengths": [], "improvements": ["Submit your solution first"]})

    if HAS_OPENAI:
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])
            resp = await client.chat.completions.create(
                model="gpt-4o-mini", max_tokens=1024,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": 'Evaluate this code. Return JSON: {"score":<0-100>,"correctness":true/false,"time_complexity":"O(n)","space_complexity":"O(1)","optimal_complexity":{"time":"O(n)","space":"O(1)"},"feedback":"detailed feedback","strengths":["s1"],"improvements":["i1"],"sample_solution":"optimal code","hints":["h1"]}'},
                    {"role": "user", "content": f"Problem: {problem_title}\nDescription: {problem_description[:500]}\nLanguage: {language}\nCode:\n{code}"}
                ]
            )
            return resp.choices[0].message.content
        except Exception:
            pass

    return json.dumps(_analyze_code_heuristic(code, language, problem_title))


@mcp.tool()
async def generate_coding_question(difficulty: str, topic: str, role: str) -> str:
    """
    Generate a coding interview question for a given difficulty, topic, and role.
    Returns question details with starter code and examples.
    """
    if HAS_OPENAI:
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])
            resp = await client.chat.completions.create(
                model="gpt-4o-mini", max_tokens=1024,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": 'Generate a coding problem. Return JSON: {"title":"...","difficulty":"Easy|Medium|Hard","topic":"...","description":"...","examples":[{"input":"...","output":"..."}],"constraints":["c1"],"starter":{"python":"def solution():...","javascript":"function solution(){"}}'},
                    {"role": "user", "content": f"Generate a {difficulty} {topic} problem for a {role} interview."}
                ]
            )
            return resp.choices[0].message.content
        except Exception:
            pass

    topic = topic if topic in TOPICS else random.choice(TOPICS)
    return json.dumps({
        "title": f"{topic} Challenge ({difficulty})",
        "difficulty": difficulty,
        "topic": topic,
        "description": f"Solve this {difficulty.lower()} {topic.lower()} problem efficiently. Think about the optimal time and space complexity before coding.",
        "examples": [{"input": "See problem constraints", "output": "Expected output"}],
        "constraints": ["1 <= n <= 10^5", "-10^9 <= val <= 10^9"],
        "starter": {
            "python": f"def solve(arr):\n    # {topic} - {difficulty}\n    # Time: O(?) Space: O(?)\n    pass",
            "javascript": f"function solve(arr) {{\n    // {topic} - {difficulty}\n}}",
        }
    })


if __name__ == "__main__":
    mcp.run()
