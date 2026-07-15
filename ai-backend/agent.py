import asyncio
import sys
import time
from datetime import datetime
from typing import AsyncIterator
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.memory import MemorySaver

load_dotenv()

# =============================================================================
# CONFIG
# =============================================================================

import os

LLM_API_KEY = os.getenv("LLM_API_KEY")
LLM_MODEL = os.getenv("LLM_MODEL")
LLM_BASE_URL = os.getenv("LLM_BASE_URL")

_CHECKPOINTER = MemorySaver()

SYSTEM_PROMPT = """Tu es Mokart Agent, un assistant IA utile et conversationnel.
- Réponds en français de façon claire et concise.
- Tu as accès à la mémoire de la conversation, utilise-la pour contexte.
- Sois direct et naturel."""


# =============================================================================
# LOGGING
# =============================================================================


def _debug(msg: str):
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"==DEBUG== [{timestamp}]   {msg}", file=sys.stderr)


# =============================================================================
# LLM
# =============================================================================


def build_llm(streaming: bool = True) -> ChatOpenAI:
    return ChatOpenAI(
        model=LLM_MODEL,
        api_key=LLM_API_KEY,
        base_url=LLM_BASE_URL,
        streaming=streaming,
        temperature=0.7,
    )


# =============================================================================
# AGENT
# =============================================================================


async def build_agent():
    """Construit l'agent conversationnel avec mémoire."""
    llm = build_llm(streaming=True)

    agent = create_react_agent(
        model=llm,
        tools=[],
        prompt=SYSTEM_PROMPT,
        checkpointer=_CHECKPOINTER,
    )

    _debug("✅ Agent prêt")
    return agent


# =============================================================================
# EXECUTION
# =============================================================================


async def run_agent_stream(
    agent, message: str, thread_id: str
) -> AsyncIterator[tuple[str, str]]:
    """
    Exécute une requête en streaming token par token.
    Yield des tuples (kind, text) où kind est "token" ou "status".
    """
    config = {"configurable": {"thread_id": thread_id}, "recursion_limit": 50}
    inputs = {"messages": [HumanMessage(content=message)]}

    try:
        async for event in agent.astream_events(inputs, config=config, version="v2"):
            kind = event["event"]

            if kind == "on_chat_model_stream":
                chunk = event["data"].get("chunk")
                if chunk is None:
                    continue
                token = getattr(chunk, "content", "")
                if token:
                    yield ("token", token)

    except Exception as e:
        _debug(f"❌ Stream erreur: {e}")
        import traceback
        traceback.print_exc()
        yield ("token", f"\n\n❌ Erreur: {e}")


# =============================================================================
# CLI
# =============================================================================


async def main():
    print("Mokart Agent (Ctrl+C to quit)")
    print(f"LLM: {LLM_BASE_URL}")
    print(f"Model: {LLM_MODEL}")
    print()

    agent = await build_agent()

    thread_id = f"cli_{int(time.time())}"

    while True:
        try:
            user_input = input("\n> ").strip()
            if not user_input:
                continue
            if user_input.lower() in ["quit", "exit", "q"]:
                break

            _debug(f"Requête: {user_input}")
            print()
            async for kind, text in run_agent_stream(agent, user_input, thread_id):
                print(text, end="", flush=True)
            print()

        except KeyboardInterrupt:
            break
        except EOFError:
            break


if __name__ == "__main__":
    asyncio.run(main())
