import asyncio
import sys
from datetime import datetime
from typing import AsyncIterator
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.messages import AIMessage, HumanMessage
from langgraph.prebuilt import create_react_agent

load_dotenv()

# =============================================================================
# CONFIG
# =============================================================================

import os

LLM_API_KEY = os.getenv("LLM_API_KEY")
LLM_MODEL = os.getenv("LLM_MODEL")
LLM_BASE_URL = os.getenv("LLM_BASE_URL")

MAX_TURNS = 20
MAX_MESSAGE_CHARS = 4000
MAX_TOTAL_CHARS = 24000

SYSTEM_PROMPT = """Tu es Mokart Agent, un assistant IA utile et conversationnel.
- Réponds en français de façon claire et concise.
- Tu as accès à l'historique de la conversation, utilise-le pour contexte.
- Sois direct et naturel.
- Ne demande jamais de données personnelles, de mot de passe ou de moyen de paiement."""


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
    """Construit l'agent conversationnel."""
    llm = build_llm(streaming=True)

    agent = create_react_agent(
        model=llm,
        tools=[],
        prompt=SYSTEM_PROMPT,
    )

    _debug("✅ Agent prêt")
    return agent


# =============================================================================
# EXECUTION
# =============================================================================


def to_langchain_messages(history: list) -> list:
    if not isinstance(history, list):
        raise ValueError("messages doit être une liste")
    cleaned = []
    for item in history[-MAX_TURNS:]:
        if not isinstance(item, dict):
            continue
        role = item.get("role")
        content = item.get("content")
        if role not in ("user", "assistant") or not isinstance(content, str) or not content.strip():
            continue
        if len(content) > MAX_MESSAGE_CHARS:
            raise ValueError("message trop long")
        cleaned.append(HumanMessage(content=content) if role == "user" else AIMessage(content=content))
    if not cleaned or not isinstance(cleaned[-1], HumanMessage):
        raise ValueError("le dernier message doit venir de l'utilisateur")
    if sum(len(m.content) for m in cleaned) > MAX_TOTAL_CHARS:
        raise ValueError("conversation trop longue")
    return cleaned


async def run_agent_stream(
    agent, messages: list
) -> AsyncIterator[tuple[str, str]]:
    """
    Exécute une requête en streaming token par token.
    Yield des tuples (kind, text) où kind est "token" ou "status".
    """
    config = {"recursion_limit": 50}
    inputs = {"messages": messages}

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
        yield ("token", "\n\nL'agent a rencontré une erreur, réessaie dans un instant.")


# =============================================================================
# CLI
# =============================================================================


async def main():
    print("Mokart Agent (Ctrl+C to quit)")
    print(f"LLM: {LLM_BASE_URL}")
    print(f"Model: {LLM_MODEL}")
    print()

    agent = await build_agent()

    history = []

    while True:
        try:
            user_input = input("\n> ").strip()
            if not user_input:
                continue
            if user_input.lower() in ["quit", "exit", "q"]:
                break

            _debug(f"Requête: {user_input}")
            print()
            history.append({"role": "user", "content": user_input})
            answer = ""
            async for kind, text in run_agent_stream(agent, to_langchain_messages(history)):
                print(text, end="", flush=True)
                answer += text
            history.append({"role": "assistant", "content": answer})
            print()

        except KeyboardInterrupt:
            break
        except EOFError:
            break


if __name__ == "__main__":
    asyncio.run(main())
