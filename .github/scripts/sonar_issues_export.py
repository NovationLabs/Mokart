#!/usr/bin/env python3
"""Export SonarQube Cloud issues for human and automated review (stdlib only)."""
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

BASE = "https://sonarcloud.io"
PROJECT = "mokart"
BRANCH = "dev"
PAGE_SIZE = 100
OUT = Path("sonar-report")
METRICS = (
    "bugs,vulnerabilities,code_smells,alert_status,coverage,"
    "duplicated_lines_density,ncloc,security_rating,reliability_rating,sqale_rating"
)


def fetch(path, params):
    url = BASE + path + "?" + urllib.parse.urlencode(params)
    headers = {"Accept": "application/json", "User-Agent": "Mokart-Sonar-Export/1.0"}
    token = os.environ.get("SONAR_TOKEN", "").strip()
    if token:
        headers["Authorization"] = "Bearer " + token
    request = urllib.request.Request(url, headers=headers)
    for attempt in range(3):
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                return json.load(response)
        except urllib.error.HTTPError as exc:
            if exc.code not in (429, 500, 502, 503, 504) or attempt == 2:
                raise
        except (urllib.error.URLError, TimeoutError):
            if attempt == 2:
                raise
        time.sleep(2 ** attempt)
    raise RuntimeError("SonarCloud request failed")


def all_issues():
    issues = []
    page = 1
    while True:
        data = fetch("/api/issues/search", {
            "componentKeys": PROJECT, "branch": BRANCH,
            "issueStatuses": "OPEN,CONFIRMED", "ps": PAGE_SIZE, "p": page,
        })
        batch = data.get("issues", [])
        total = int(data.get("total", 0))
        issues.extend(batch)
        if not batch or len(issues) >= total:
            if len(issues) != total:
                raise RuntimeError(f"Incomplete issues export: {len(issues)} of {total}")
            return issues
        page += 1
        if page > 100:
            raise RuntimeError("Issue export exceeded 100 pages")


def main():
    issues = all_issues()
    measures_data = fetch("/api/measures/component", {
        "component": PROJECT, "branch": BRANCH, "metricKeys": METRICS,
    })
    measures = {
        item["metric"]: item.get("value")
        for item in measures_data.get("component", {}).get("measures", [])
    }
    by_severity = Counter(issue.get("severity", "UNKNOWN") for issue in issues)
    by_type = Counter(issue.get("type", "UNKNOWN") for issue in issues)
    by_status = Counter(issue.get("issueStatus", issue.get("status", "UNKNOWN")) for issue in issues)
    by_rule = Counter(issue.get("rule", "UNKNOWN") for issue in issues)
    by_component = Counter(issue.get("component", "UNKNOWN") for issue in issues)
    by_impact = Counter(
        f"{impact.get('softwareQuality', 'UNKNOWN')}:{impact.get('severity', 'UNKNOWN')}"
        for issue in issues for impact in issue.get("impacts", [])
    )
    report = {
        "schema_version": 1,
        "source": BASE,
        "project": PROJECT,
        "branch": BRANCH,
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "github_sha": os.environ.get("GITHUB_SHA", ""),
        "query": {"issueStatuses": "OPEN,CONFIRMED"},
        "total_open_issues": len(issues),
        "metrics": measures,
        "counts": {
            "severity": dict(sorted(by_severity.items())),
            "type": dict(sorted(by_type.items())),
            "status": dict(sorted(by_status.items())),
            "impact": dict(sorted(by_impact.items())),
            "rule": dict(by_rule.most_common()),
            "component": dict(by_component.most_common()),
        },
        "issues": issues,
    }
    OUT.mkdir(exist_ok=True)
    (OUT / "issues.json").write_text(
        json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    summary = [
        "# Mokart SonarCloud issue export",
        "",
        f"- Project: {PROJECT} / {BRANCH}",
        f"- Generated: {report['generated_at_utc']}",
        f"- Open or confirmed issues: **{len(issues)}**",
        f"- Quality gate: **{measures.get('alert_status', 'UNKNOWN')}**",
        "",
        "## Issue counts by severity",
        "",
    ]
    summary.extend(f"- {key}: {value}" for key, value in sorted(by_severity.items()))
    summary += ["", "## Issue counts by impact", ""]
    summary.extend(f"- {key}: {value}" for key, value in sorted(by_impact.items()))
    summary += [
        "", "The complete machine-readable report is in issues.json.",
        "It includes original SonarCloud issue fields, locations, messages, rule IDs,",
        "effort, impact metadata and available measures.",
        "This report reflects the latest SonarCloud analysis, not necessarily the workflow commit.",
    ]
    (OUT / "summary.md").write_text("\n".join(summary) + "\n", encoding="utf-8")
    print("\n".join(summary))
    if os.environ.get("GITHUB_STEP_SUMMARY"):
        with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as output:
            output.write("\n".join(summary) + "\n")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:
        print(f"SonarCloud export failed: {type(exc).__name__}: {exc}", file=sys.stderr)
        sys.exit(1)
