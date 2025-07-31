from dotenv import load_dotenv
import os
import json
import logging
from datetime import datetime
from typing import List, Dict, Any
import traceback
import time

# โหลดค่าจาก .env
load_dotenv()

# ตั้งค่า logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

from langchain_openai import OpenAI
from langchain.agents import initialize_agent, Tool
from langchain.agents.agent_types import AgentType
from langchain_experimental.tools import PythonREPLTool
from langchain_community.tools.shell import ShellTool
from langchain_community.tools import DuckDuckGoSearchRun

class AgenticAI:
    def __init__(self, api_key: str = None):
        """
        สร้าง Agentic AI System ที่สามารถทำงานแบบอัตโนมัติ
        
        Args:
            api_key: OpenAI API Key
        """
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.memory = {}  # External memory store
        self.todo_list = []  # Task management
        self.context_manager = ContextManager()
        self.error_recovery = ErrorRecovery()
        
        # สร้าง LLM
        self.llm = OpenAI(
            model="gpt-4o-mini",
            temperature=0.5,
            api_key=self.api_key,
            max_tokens=16384,
            request_timeout=60
        )
        
        # สร้าง Tools
        self.tools = self._create_tools()
        
        # สร้าง Agent
        self.agent = initialize_agent(
            tools=self.tools,
            llm=self.llm,
            agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
            verbose=True,
            max_iterations=None,
            early_stopping_method="force",
            handle_parsing_errors=True
        )
        
        logger.info("Agentic AI System initialized successfully")
    
    def _create_tools(self) -> List[Tool]:
        """สร้าง Tools ที่ Agent สามารถใช้ได้"""
        
        # Python REPL Tool
        python_repl = PythonREPLTool()
        
        # Shell Tool
        shell_tool = ShellTool()
        
        # Search Tool
        search_tool = DuckDuckGoSearchRun()
        
        tools = [
            Tool.from_function(
                func=python_repl.run,
                name="PythonREPL",
                description="Execute Python code for file manipulation, data processing, calculations,create file, etc. Can import any Python libraries."
            ),
            Tool.from_function(
                func=shell_tool.run,
                name="ShellTool",
                description="Execute shell commands for file operations, directory listing, system operations, etc."
            ),
            Tool.from_function(
                func=search_tool.run,
                name="WebSearch",
                description="Search the internet for additional information on any topic."
            ),
            Tool.from_function(
                func=self.read_file,
                name="ReadFile",
                description="Read contents of a file. Input: file_path"
            ),
            Tool.from_function(
                func=self.write_file,
                name="WriteFile",
                description="Write content to a file. Input: file_path|content (separated by |)"
            ),
            Tool.from_function(
                func=self.append_file,
                name="AppendFile",
                description="Append content to a file. Input: file_path|content (separated by |)"
            ),
            Tool.from_function(
                func=self.memory_store,
                name="MemoryStore",
                description="Store information in memory for later use. Input: key|value (separated by |)"
            ),
            Tool.from_function(
                func=self.memory_retrieve,
                name="MemoryRetrieve",
                description="Retrieve information from memory. Input: key"
            ),
            Tool.from_function(
                func=self.todo_add,
                name="TodoAdd",
                description="Add a task to the to-do list. Input: task_description"
            ),
            Tool.from_function(
                func=self.todo_complete,
                name="TodoComplete",
                description="Mark a task as completed. Input: task_index (0-based)"
            ),
            Tool.from_function(
                func=self.todo_list_show,
                name="TodoShow",
                description="Show current to-do list"
            ),
            Tool.from_function(
                func=self.save_progress,
                name="SaveProgress",
                description="Save current progress state for recovery purposes"
            ),
            Tool.from_function(
                func=self.load_progress,
                name="LoadProgress",
                description="Load previously saved progress state"
            )
        ]
        
        return tools
    
    def read_file(self, file_path: str) -> str:
        """อ่านไฟล์"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            logger.info(f"Successfully read file: {file_path}")
            return content
        except Exception as e:
            logger.error(f"Error reading file {file_path}: {str(e)}")
            return f"Error reading file: {str(e)}"
    
    def write_file(self, input_str: str) -> str:
        """เขียนไฟล์"""
        try:
            parts = input_str.split('|', 1)
            if len(parts) != 2:
                return "Error: Input must be in format 'file_path|content'"
            
            file_path, content = parts
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            logger.info(f"Successfully wrote to file: {file_path}")
            return f"Successfully wrote to file: {file_path}"
        except Exception as e:
            logger.error(f"Error writing file: {str(e)}")
            return f"Error writing file: {str(e)}"
    
    def append_file(self, input_str: str) -> str:
        """เพิ่มข้อมูลต่อท้ายไฟล์"""
        try:
            parts = input_str.split('|', 1)
            if len(parts) != 2:
                return "Error: Input must be in format 'file_path|content'"
            
            file_path, content = parts
            with open(file_path, 'a', encoding='utf-8') as f:
                f.write(content)
            logger.info(f"Successfully appended to file: {file_path}")
            return f"Successfully appended to file: {file_path}"
        except Exception as e:
            logger.error(f"Error appending to file: {str(e)}")
            return f"Error appending to file: {str(e)}"
    
    def memory_store(self, input_str: str) -> str:
        """เก็บข้อมูลใน memory"""
        try:
            parts = input_str.split('|', 1)
            if len(parts) != 2:
                return "Error: Input must be in format 'key|value'"
            
            key, value = parts
            self.memory[key] = value
            logger.info(f"Stored in memory: {key}")
            return f"Successfully stored in memory: {key}"
        except Exception as e:
            return f"Error storing in memory: {str(e)}"
    
    def memory_retrieve(self, key: str) -> str:
        """ดึงข้อมูลจาก memory"""
        try:
            if key in self.memory:
                return self.memory[key]
            else:
                return f"Key '{key}' not found in memory"
        except Exception as e:
            return f"Error retrieving from memory: {str(e)}"
    
    def todo_add(self, task: str) -> str:
        """เพิ่มงานใน to-do list"""
        try:
            self.todo_list.append({"task": task, "completed": False, "created": datetime.now()})
            logger.info(f"Added task to todo: {task}")
            self.save_progress()  # Save progress after adding a task
            return f"Added task: {task}"
        except Exception as e:
            return f"Error adding task: {str(e)}"
    
    def todo_complete(self, task_index: str) -> str:
        """ทำเครื่องหมายงานเสร็จใน to-do list"""
        try:
            index = int(task_index)
            if 0 <= index < len(self.todo_list):
                self.todo_list[index]["completed"] = True
                self.todo_list[index]["completed_at"] = datetime.now()
                task_name = self.todo_list[index]["task"]
                logger.info(f"Completed task: {task_name}")
                self.save_progress()  # Save progress after marking as completed
                todo_list_str = self.todo_list_show()

                return f"Completed task: {task_name}\n\n{todo_list_str}"
            else:
                return f"Invalid task index: {index}"
        except Exception as e:
            return f"Error completing task: {str(e)}"
    
    def todo_list_show(self, dummy_input: str = "") -> str:
        """แสดง to-do list"""
        try:
            if not self.todo_list:
                return "To-do list is empty"
            
            result = "Current To-Do List:\n"
            for i, item in enumerate(self.todo_list):
                status = "✓" if item["completed"] else "○"
                result += f"{i}. {status} {item['task']}\n"
            
            return result
        except Exception as e:
            return f"Error showing todo list: {str(e)}"
    
    def save_progress(self, dummy_input: str = "") -> str:
        """บันทึก progress สำหรับการกู้คืน"""
        try:
            progress_data = {
                "memory": self.memory,
                "todo_list": self.todo_list,
                "timestamp": datetime.now().isoformat()
            }
            
            with open("progress_save.json", "w", encoding="utf-8") as f:
                json.dump(progress_data, f, ensure_ascii=False, indent=2, default=str)
            
            logger.info("Progress saved successfully")
            return "Progress saved successfully"
        except Exception as e:
            return f"Error saving progress: {str(e)}"
    
    def load_progress(self, dummy_input: str = "") -> str:
        """โหลด progress ที่บันทึกไว้"""
        try:
            if not os.path.exists("progress_save.json"):
                return "No saved progress found"
            
            with open("progress_save.json", "r", encoding="utf-8") as f:
                progress_data = json.load(f)
            
            self.memory = progress_data.get("memory", {})
            self.todo_list = progress_data.get("todo_list", [])
            
            logger.info("Progress loaded successfully")
            return f"Progress loaded successfully from {progress_data.get('timestamp', 'unknown time')}"
        except Exception as e:
            return f"Error loading progress: {str(e)}"
    
    def run_autonomous_task(self, task_description: str, retry_delay: int = 2) -> str:
        """
        รันงานแบบอัตโนมัติ พร้อมกับการจัดการข้อผิดพลาดและการกู้คืน
        จะพยายามซ้ำเรื่อยๆ จนกว่าจะสำเร็จ

        Args:
            task_description: คำอธิบายงานที่ต้องการให้ทำ
            retry_delay: หน่วงเวลาก่อนลองใหม่ (วินาที)

        Returns:
            ผลลัพธ์ของงาน
        """
        system_prompt = self._create_autonomous_prompt(task_description)
        attempt = 0

        while True:
            try:
                attempt += 1
                logger.info(f"Starting autonomous task (attempt {attempt})")

                # Save progress before task
                self.save_progress()

                # Run task
                result = self.agent.run(system_prompt)

                # Show current to-do list after each main task execution
                todo_list_str = self.todo_list_show()
                logger.info(f"Current To-Do List after task execution:\n{todo_list_str}")
                print(f"\nCurrent To-Do List after task execution:\n{todo_list_str}")

                # ตรวจว่าผลลัพธ์สำเร็จจริงไหม
                if result and "task failed" not in result.lower():
                    logger.info("Autonomous task completed successfully")
                    return result + f"\n\nCurrent To-Do List after completion:\n{todo_list_str}"

                logger.warning(f"Unexpected result, will retry. Result: {result}")

            except Exception as e:
                error_msg = f"Attempt {attempt} failed: {str(e)}"
                logger.error(error_msg)

                # Log recovery and prepare for next round
                self.error_recovery.log_error(e, task_description)
                recovery_result = self.load_progress()
                logger.info(f"Recovery result: {recovery_result}")
                system_prompt = self._create_recovery_prompt(task_description, str(e))

            # Wait before retry
            logger.info(f"Retrying in {retry_delay} seconds...")
            time.sleep(retry_delay)

    def _create_autonomous_prompt(self, task_description: str) -> str:
        """สร้าง System Prompt สำหรับงานอัตโนมัติ"""
        
        prompt = f"""
You are an autonomous AI agent capable of completing complex tasks without human intervention.

TASK DESCRIPTION:
{task_description}

AVAILABLE TOOLS:
- PythonREPL: Execute Python code for file manipulation, data processing, calculations , Rename file do not Rename last '.' dot
- ShellTool: Execute shell commands for file operations, directory listing, system operations
- WebSearch: Search the internet for additional information
- ReadFile: Read contents of a file
- WriteFile: Write content to a file
- AppendFile: Append content to a file (useful for building large outputs in chunks)
- MemoryStore: Store information in external memory for later use
- MemoryRetrieve: Retrieve information from external memory
- TodoAdd: Add tasks to your to-do list for planning
- TodoComplete: Mark tasks as completed
- TodoShow: Show your current to-do list
- SaveProgress: Save your current progress state
- LoadProgress: Load previously saved progress state

AUTONOMOUS EXECUTION RULES:
1. You must complete this task WITHOUT any human intervention
2. If you encounter errors, you must handle them yourself - try alternative approaches
3. Break down complex tasks into smaller, manageable pieces
4. Use the todo list to plan and track your progress
5. Use memory to store important information and summaries
6. For large outputs, write content in sections using AppendFile to avoid context limits
7. Save your progress periodically in case of interruption
8. If you need to restart, load your previous progress and continue from where you left off
9. Be resourceful - use web search for additional information if needed
10. Handle file naming issues by using shell commands if direct file operations fail

APPROACH:
1. First, create a plan by adding tasks to your todo list
2. Break down the work into logical steps
3. Execute each step, saving progress along the way
4. Use memory to store summaries and important findings
5. For large content creation, write in sections to manage context
6. Mark tasks as completed as you finish them
7. Handle any errors autonomously by trying alternative methods

BEGIN AUTONOMOUS EXECUTION NOW:
"""
        
        return prompt
    
    def _create_recovery_prompt(self, task_description: str, error_msg: str) -> str:
        """สร้าง Prompt สำหรับการกู้คืนหลังเกิดข้อผิดพลาด"""
        
        prompt = f"""
RECOVERY MODE: You encountered an error and are now restarting.

ORIGINAL TASK: {task_description}

ERROR ENCOUNTERED: {error_msg}

INSTRUCTIONS:
1. First, load your previous progress using LoadProgress
2. Check your todo list to see what was completed
3. Review your memory to understand what you had accomplished
4. Continue from where you left off
5. If the same error occurs, try a different approach
6. You must complete the task autonomously

RECOVERY STRATEGIES:
- If file access failed, try using shell commands
- If context limit was reached, work in smaller chunks
- If a tool failed, try an alternative tool
- If output was too large, break it into sections

CONTINUE AUTONOMOUS EXECUTION:
"""
        
        return prompt


class ContextManager:
    """จัดการ Context Window"""
    
    def __init__(self, max_context_size: int = 15000):
        self.max_context_size = max_context_size
        self.current_context_size = 0
    
    def estimate_token_count(self, text: str) -> int:
        """ประเมินจำนวน tokens (โดยประมาณ)"""
        return len(text.split()) * 1.3  # ประมาณการหยาบๆ
    
    def check_context_limit(self, text: str) -> bool:
        """ตรวจสอบว่าเกิน context limit หรือไม่"""
        estimated_tokens = self.estimate_token_count(text)
        return estimated_tokens > self.max_context_size


class ErrorRecovery:
    """จัดการการกู้คืนจากข้อผิดพลาด"""
    
    def __init__(self):
        self.error_history = []
    
    def log_error(self, error: Exception, context: str):
        """บันทึกข้อผิดพลาด"""
        self.error_history.append({
            "error": str(error),
            "context": context,
            "timestamp": datetime.now(),
            "traceback": traceback.format_exc()
        })
    
    def get_recovery_strategy(self, error: Exception) -> str:
        """เสนอแนะกลยุทธ์การกู้คืน"""
        error_str = str(error).lower()
        
        if "file" in error_str and "not found" in error_str:
            return "Try using shell commands to list files and check file paths"
        elif "permission" in error_str:
            return "Try using shell commands with appropriate permissions"
        elif "context" in error_str or "token" in error_str:
            return "Break down the task into smaller chunks and use external storage"
        elif "timeout" in error_str:
            return "Retry with smaller operations or increase timeout"
        else:
            return "Try alternative tools or approaches"


# ตัวอย่างการใช้งาน
def main():
    # สร้าง Agentic AI
    agent = AgenticAI()
    
    # ตัวอย่างงานที่ซับซ้อน
    complex_task = """
    I want you to read Transcript files located in the "Agent-Python\agentic_ai.py"
    " folder. After reading and understanding the contents, 
    perform additional research on the internet related to the topics in those files. Then, write a long, complete, 
    and well-structured article that integrates both the information from the files and the additional findings.
    Once the article is complete, save it into a new file in the working directory. Always Show your current to-do list , 
    Thinking by yourself need to complete all task"""
    
    # รันงานแบบอัตโนมัติ
    result = agent.run_autonomous_task(complex_task)
    print(f"\nFinal Result: {result}")


if __name__ == "__main__":
    main()