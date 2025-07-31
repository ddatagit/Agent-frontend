import os
import logging
from dotenv import load_dotenv
from datetime import datetime
from typing import List
from openai import OpenAI as RawOpenAI

from langchain_openai import ChatOpenAI
from langchain.agents import Tool, initialize_agent
from langchain.agents.agent_types import AgentType
from langchain_experimental.tools import PythonREPLTool
from langchain_community.tools.shell import ShellTool
from langchain_community.tools import DuckDuckGoSearchRun

# Load .env file (e.g., .env.docker)
load_dotenv(dotenv_path=".env.docker")
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("❌ Missing OPENAI_API_KEY in .env.docker")

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


class AgenticAI:
    def __init__(self):
        self.api_key = api_key
        self.todo_list = []

        self.llm = ChatOpenAI(
            model="gpt-4o",
            temperature=0.5,
            api_key=self.api_key,
            max_tokens=4096,
            request_timeout=60,
        )

        self.tools = self._create_tools()

        self.agent = initialize_agent(
            tools=self.tools,
            llm=self.llm,
            agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
            verbose=True,
            max_iterations=10,
            handle_parsing_errors=True,
        )

        logger.info("✅ AgenticAI initialized")

    def _create_tools(self) -> List[Tool]:
        def debug_duckduckgo_search(query: str, **kwargs) -> str:
            print(f"🔍 [DEBUG] InternetSearch input: {query}")
            try:
                # Pass along any extra kwargs (callbacks, run_manager, etc.)
                result = DuckDuckGoSearchRun().run(query, **kwargs)
                print(f"📥 [DEBUG] InternetSearch result:\n{result}")
                return result
            except Exception as e:
                # You can log e or raise if you want full trace
                print(f"❌ [DEBUG] Error in InternetSearch: {e}")
                return "⚠️ Error during DuckDuckGo search."

        return [
            Tool.from_function(
                func=debug_duckduckgo_search,
                name="InternetSearch",
                description="Search the internet for real-time information, news, and public data.",
            ),
            Tool.from_function(
                func=PythonREPLTool().run,
                name="PythonREPL",
                description="Run Python code for math or logic operations.",
            ),
            Tool.from_function(
                func=ShellTool().run,
                name="ShellTool",
                description="Run shell commands (Linux-based)",
            ),
            Tool.from_function(
                func=self.run_autonomous_task,
                name="SimpleChat",
                description="Use GPT to answer a general question or respond in free-form",
            ),
            Tool.from_function(
                func=self.add_task,
                name="TodoAdd",
                description="Add a task to the todo list. Input: task description",
            ),
            Tool.from_function(
                func=self.show_tasks,
                name="TodoShow",
                description="Show the current todo list.",
            ),
        ]

    def add_task(self, task: str) -> str:
        self.todo_list.append({"task": task, "created": datetime.now(), "completed": False})
        print(f"✅ Task added: {task}")
        return f"Task added: {task}"

    def show_tasks(self, dummy: str = "") -> str:
        if not self.todo_list:
            return "❌ No tasks in the todo list."
        result = "💼 Todo List:\n"
        for i, t in enumerate(self.todo_list):
            status = "✓" if t["completed"] else "○"
            result += f"{i+1}. {status} {t['task']}\n"
        print(result)
        return result

    def run_autonomous_task(self, task: str) -> str:
        print(f"\n🧠 [SimpleChat] Received Task:\n{task}\n")
        try:
            self.add_task(task)
            print("⏳ Sending request to OpenAI...")

            raw_client = RawOpenAI(api_key=self.api_key)
            response = raw_client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": task},
                ],
                temperature=0.7,
                max_tokens=800,
            )

            result = response.choices[0].message.content.strip()

            print("\n✅ [SimpleChat] Response from OpenAI:")
            print(result)
            return result
        except Exception as e:
            print(f"❌ Error during OpenAI call: {e}")
            return "⚠️ Failed to get response from OpenAI."

# # Example usage
# if __name__ == "__main__":
#     agent = AgenticAI()

#     # Run InternetSearch directly with debug
#     print("\n🚀 Running InternetSearch manually...\n")
#     agent.tools[0].func("latest AI research 2025")

#     # Run SimpleChat manually
#     print("\n🧠 Running SimpleChat manually...\n")
#     agent.run_autonomous_task("Summarize the current trends in AI agents for automation.")
