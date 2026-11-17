#!/usr/bin/env python3
"""Send the SonarQube Cloud results for a newly analyzed dev commit to Discord."""
import uuid
from pathlib import Path

from sonar_quality_card import create_card
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

BASE = "https://sonarcloud.io"
PROJECT = "mokart"
BRANCH = "dev"
AVATAR = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSZGGRLxU67bOko8hrLW5dHf0vqjH5u__Lvx-novYeFHHwUdoKLVyzvMLro&s=10"

def get(path, params):
    url = BASE + path + "?" + urllib.parse.urlencode(params)
    headers = {"Accept": "application/json", "User-Agent": "Mokart-Sonar-Discord/1.0"}
    token = os.getenv("SONAR_TOKEN", "").strip()
    if token:
        headers["Authorization"] = f"Bearer {token}"
    with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=25) as response:
        return json.load(response)

def issue_count(quality, severities=None):
    params = {"componentKeys": PROJECT, "branch": BRANCH,
              "impactSoftwareQualities": quality, "issueStatuses": "OPEN,CONFIRMED", "ps": 1}
    if severities:
        params["impactSeverities"] = severities
    return int(get("/api/issues/search", params)["total"])

def rating(measures, metric):
    try:
        number = int(float(measures.get(metric)))
        return "ABCDE"[number - 1] if 1 <= number <= 5 else "—"
    except (ValueError, TypeError):
        return "—"

def analysis_matches(sha):
    results = get("/api/project_analyses/search", {"project": PROJECT, "branch": BRANCH, "ps": 1})
    latest = (results.get("analyses") or [{}])[0]
    revision = latest.get("revision", "")
    return bool(revision and (sha.startswith(revision) or revision.startswith(sha)))

def commit_title(sha):
    """Read the real push commit title from the GitHub Actions event payload."""
    event_file = os.getenv("GITHUB_EVENT_PATH")
    if event_file:
        try:
            with open(event_file, encoding="utf-8") as source:
                event = json.load(source)
            message = (event.get("head_commit") or {}).get("message", "")
            if message.strip():
                return message.splitlines()[0].strip()
        except (OSError, ValueError, TypeError):
            pass
    # Fallback for manual workflow_dispatch, which has no head_commit payload.
    try:
        url = f"https://api.github.com/repos/NovationLabs/Mokart/commits/{sha}"
        request = urllib.request.Request(url, headers={
            "Accept": "application/vnd.github+json",
            "User-Agent": "Mokart-Sonar-Discord/1.0",
        })
        with urllib.request.urlopen(request, timeout=15) as response:
            message = json.load(response)["commit"]["message"]
        return message.splitlines()[0].strip() or f"Commit {sha[:7]}"
    except (urllib.error.URLError, KeyError, ValueError, IndexError):
        return f"Commit {sha[:7]}"


def short_title(title, limit=85):
    return title if len(title) <= limit else title[:limit - 5].rstrip() + "[...]"


STATE_PATH = Path(".sonar-momo/state.json")


def read_previous():
    try:
        state = json.loads(STATE_PATH.read_text(encoding="utf-8"))
        return state.get("counts", {}) if isinstance(state, dict) else {}
    except (OSError, ValueError):
        return {}


def save_current(sha, counts):
    STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    STATE_PATH.write_text(json.dumps({"sha": sha, "counts": counts}), encoding="utf-8")


def post_card(webhook, payload, image_data):
    """Send the PNG as a Discord embed attachment in the same multipart POST."""
    boundary = "momo-" + uuid.uuid4().hex
    body = bytearray()
    def add_part(name, data, content_type, filename=None):
        disposition = f'Content-Disposition: form-data; name="{name}"'
        if filename:
            disposition += f'; filename="{filename}"'
        body.extend(f"--{boundary}\r\n{disposition}\r\nContent-Type: {content_type}\r\n\r\n".encode())
        body.extend(data)
        body.extend(b"\r\n")
    add_part("payload_json", json.dumps(payload, ensure_ascii=False).encode("utf-8"), "application/json")
    add_part("files[0]", image_data, "image/png", filename="mokart-quality.png")
    body.extend(f"--{boundary}--\r\n".encode())
    request = urllib.request.Request(
        webhook, data=bytes(body), method="POST",
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}",
                 "User-Agent": "Mokart-Sonar-Discord/1.0"})
    with urllib.request.urlopen(request, timeout=30) as response:
        print(f"Discord notification delivered: {response.status}")


def main():
    webhook = os.getenv("DISCORD_WEBHOOK_URL", "").strip()
    sha = os.getenv("GITHUB_SHA", "").strip()
    if not webhook:
        print("DISCORD_WEBHOOK_URL not configured; skipping.")
        return 0
    if not sha:
        raise RuntimeError("Missing GITHUB_SHA")

    for attempt in range(30):
        try:
            if analysis_matches(sha):
                break
        except (urllib.error.URLError, TimeoutError, KeyError, ValueError) as exc:
            print(f"Waiting for SonarQube analysis ({attempt + 1}): {exc}", flush=True)
        if attempt == 29:
            raise RuntimeError("SonarQube has not analyzed this commit after 15 minutes; no stale report posted")
        time.sleep(30)

    result = get("/api/measures/component", {"component": PROJECT, "branch": BRANCH,
        "metricKeys": "security_rating,reliability_rating,sqale_rating,alert_status,duplicated_lines_density,ncloc,coverage"})
    measures = {item["metric"]: item.get("value") for item in result["component"].get("measures", [])}
    counts = {quality: issue_count(quality) for quality in ("SECURITY", "RELIABILITY", "MAINTAINABILITY")}
    urgent = issue_count("SECURITY", "BLOCKER,HIGH")
    passed = measures.get("alert_status") == "OK"

    previous = read_previous()
    rating_map = {
        "SECURITY": rating(measures, "security_rating"),
        "RELIABILITY": rating(measures, "reliability_rating"),
        "MAINTAINABILITY": rating(measures, "sqale_rating"),
    }
    image_data = create_card(rating_map, counts, previous)

    fields = [
        {"name": "Blocker + High · Security", "value": f"**{urgent}** issues prioritaires", "inline": True},
        {"name": "Duplications", "value": f"**{measures.get('duplicated_lines_density', '—')}%**", "inline": True},
        {"name": "Coverage", "value": f"**{measures['coverage']}%**" if "coverage" in measures else "Non configuré", "inline": True},
    ]
    view_url = "https://sonarcloud.io/summary/overall?id=mokart&branch=dev"
    commit_url = f"https://github.com/NovationLabs/Mokart/commit/{sha}"
    title = short_title(commit_title(sha))
    payload = {
        "username": "momo 🙊", "avatar_url": AVATAR, "allowed_mentions": {"parse": []},
        "embeds": [{
            "title": "✅ Quality Gate · PASSED" if passed else "🚨 Quality Gate · FAILED / UNKNOWN",
            "url": view_url,
            "description": f"**Mokart** · dev · [{sha[:7]}]({commit_url})\n{title}",
            "color": 0x57F287 if passed else 0xED4245,
            "fields": fields,
            "image": {"url": "attachment://mokart-quality.png"}
        }]
    }
    post_card(webhook, payload, image_data)
    save_current(sha, counts)
    return 0

if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:
        print(f"Notification failed: {type(exc).__name__}: {exc}", file=sys.stderr)
        sys.exit(1)
