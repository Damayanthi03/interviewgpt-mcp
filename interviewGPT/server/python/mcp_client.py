"""
MCP Client — connects to Python MCP Servers via stdio transport.
Each call spawns the matching server as a subprocess, initializes the
MCP session, calls the requested tool, and returns the parsed result.
"""

import json
import os
import sys
import asyncio
from typing import Any

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client


BASE_DIR = os.path.dirname(os.path.abspath(__file__))


class MCPClientManager:
    """Lightweight MCP client that calls tools via stdio transport."""

    def __init__(self):
        self.python = sys.executable
        self.servers_dir = os.path.join(BASE_DIR, "mcp_servers")

    async def call_tool(
        self,
        server_name: str,
        tool_name: str,
        arguments: dict[str, Any],
    ) -> Any:
        """
        Spawn the MCP server as a subprocess, call the tool, return parsed JSON.
        Falls back to an empty dict on any error.
        """
        server_script = os.path.join(
            self.servers_dir, f"{server_name}_server.py"
        )
        if not os.path.exists(server_script):
            raise FileNotFoundError(f"MCP server script not found: {server_script}")

        env = dict(os.environ)
        server_params = StdioServerParameters(
            command=self.python,
            args=[server_script],
            env=env,
        )

        try:
            async with stdio_client(server_params) as (read, write):
                async with ClientSession(read, write) as session:
                    await session.initialize()
                    result = await session.call_tool(tool_name, arguments)

                    if result.content:
                        first = result.content[0]
                        raw = getattr(first, "text", None)
                        if raw:
                            try:
                                return json.loads(raw)
                            except json.JSONDecodeError:
                                return {"result": raw}
            return {}
        except Exception as exc:
            print(f"[MCPClient] Error calling {server_name}.{tool_name}: {exc}", flush=True)
            raise


# Singleton instance — import and use this everywhere
mcp = MCPClientManager()
