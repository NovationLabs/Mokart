#!/usr/bin/env python3
"""Send the SonarQube Cloud results for a newly analyzed dev commit to Discord."""
import datetime
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

    def field(name, metric, quality, emoji):
        return {"name": name, "value": f"{emoji} **{rating(measures, metric)}** · **{counts[quality]}** issues", "inline": True}

    fields = [
        field("Security", "security_rating", "SECURITY", "🛡️"),
        field("Reliability", "reliability_rating", "RELIABILITY", "⚙️"),
        field("Maintainability", "sqale_rating", "MAINTAINABILITY", "🧩"),
        {"name": "Blocker + High · Security", "value": f"**{urgent}** issues prioritaires", "inline": True},
        {"name": "Duplications", "value": f"**{measures.get('duplicated_lines_density', '—')}%**", "inline": True},
        {"name": "Coverage", "value": f"**{measures['coverage']}%**" if "coverage" in measures else "Non configuré", "inline": True},
    ]
    view_url = "https://sonarcloud.io/summary/overall?id=mokart&branch=dev"
    commit_url = f"https://github.com/NovationLabs/Mokart/commit/{sha}"
    payload = {
        "username": "momo 🙊", "avatar_url": AVATAR, "allowed_mentions": {"parse": []},
        "embeds": [{
            "title": "✅ Quality Gate · PASSED" if passed else "🚨 Quality Gate · FAILED / UNKNOWN",
            "url": view_url,
            "description": f"**Mokart** · dev · [{sha[:7]}]({commit_url})\nAnalyse terminée et associée au commit.",
            "color": 0x57F287 if passed else 0xED4245,
            "fields": fields,
            "footer": {"text": "momo 🙊 · Mokart Code Quality · SonarQube Cloud"},
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }]
    }
    request = urllib.request.Request(webhook, data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", "User-Agent": "Mokart-Sonar-Discord/1.0"}, method="POST")
    with urllib.request.urlopen(request, timeout=25) as response:
        print(f"Discord notification delivered: {response.status}")
    return 0

if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:
        print(f"Notification failed: {type(exc).__name__}: {exc}", file=sys.stderr)
        sys.exit(1)
