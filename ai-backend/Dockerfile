FROM python:3.12-slim

RUN pip install --no-cache-dir uv

WORKDIR /app

COPY pyproject.toml uv.lock* ./

RUN uv sync --no-dev

COPY . .

# Force uv to use the venv already built above
ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 8000

CMD ["uvicorn", "agent_api:app", "--host", "0.0.0.0", "--port", "8000"]
