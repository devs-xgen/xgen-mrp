#!/usr/bin/env python3
from __future__ import annotations

import argparse
from datetime import datetime
from pathlib import Path
import re


SECTIONS = [
    "Files Changed",
    "Validation",
    "React Doctor",
    "Progress Log",
    "Open Questions",
]


def slugify(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    value = re.sub(r"-{2,}", "-", value)
    return value.strip("-") or "worklog"


def split_csv(value: str | None) -> list[str]:
    if not value:
        return []
    return [item.strip() for item in value.split(",") if item.strip()]


def ensure_section(text: str, heading: str) -> str:
    marker = f"## {heading}\n"
    if marker in text:
        return text
    if not text.endswith("\n"):
        text += "\n"
    return text + f"\n## {heading}\n\n"


def replace_metadata(text: str, title: str, objective: str | None, status: str | None, updated_at: str) -> str:
    lines = text.splitlines()
    metadata = [
        f"- Date: {updated_at.split(' ')[0]}",
        f"- Last Updated: {updated_at}",
        f"- Status: {status or 'in_progress'}",
        f"- Objective: {objective or 'Not specified'}",
    ]

    if lines and lines[0].startswith("# "):
        lines[0] = f"# {title}"
    else:
        lines.insert(0, f"# {title}")

    start = 1
    if start < len(lines) and lines[start] == "":
        start += 1
    while start < len(lines) and lines[start].startswith("- "):
        start += 1
    if start < len(lines) and lines[start] == "":
        start += 1

    new_lines = [lines[0], ""] + metadata + [""]
    new_lines.extend(lines[start:])
    return "\n".join(new_lines).rstrip() + "\n"


def append_bullets(text: str, heading: str, items: list[str], timestamp: str | None = None, dedupe: bool = False) -> str:
    if not items:
        return text

    text = ensure_section(text, heading)
    pattern = re.compile(rf"(^## {re.escape(heading)}\n)(.*?)(?=^## |\Z)", re.MULTILINE | re.DOTALL)
    match = pattern.search(text)
    if not match:
        return text

    prefix, body = match.groups()
    body = body.rstrip()
    existing_lines = set(body.splitlines())
    bullet_lines = []
    for item in items:
        prefix_text = f"- [{timestamp}] " if timestamp else "- "
        line = f"{prefix_text}{item}"
        if dedupe and line in existing_lines:
            continue
        bullet_lines.append(line)

    if not bullet_lines:
        return text
    new_body = (body + "\n" if body else "") + "\n".join(bullet_lines) + "\n"
    return text[: match.start()] + prefix + new_body + text[match.end() :]


def main() -> int:
    parser = argparse.ArgumentParser(description="Create or update an AI worklog entry inside docs/technical/ai-worklog.")
    parser.add_argument("--repo-root", required=True, help="Repository root that contains docs/.")
    parser.add_argument("--slug", required=True, help="Short stable task name.")
    parser.add_argument("--title", required=True, help="Human-readable worklog title.")
    parser.add_argument("--objective", help="Short task objective.")
    parser.add_argument("--status", help="Current status, for example in_progress, completed, blocked.")
    parser.add_argument("--note", action="append", default=[], help="Progress note to append. Repeatable.")
    parser.add_argument("--files", help="Comma-separated files changed.")
    parser.add_argument("--validation", action="append", default=[], help="Validation result to append. Repeatable.")
    parser.add_argument("--react-doctor", action="append", default=[], dest="react_doctor", help="React Doctor note to append. Repeatable.")
    parser.add_argument("--open-question", action="append", default=[], dest="open_questions", help="Open question or risk to append. Repeatable.")
    args = parser.parse_args()

    now = datetime.now()
    date_str = now.strftime("%Y-%m-%d")
    timestamp = now.strftime("%H:%M")
    updated_at = now.strftime("%Y-%m-%d %H:%M")

    repo_root = Path(args.repo_root).resolve()
    log_dir = repo_root / "docs" / "technical" / "ai-worklog"
    log_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{date_str}-{slugify(args.slug)}.md"
    log_path = log_dir / filename

    if log_path.exists():
        text = log_path.read_text(encoding="utf-8")
    else:
        text = ""

    text = replace_metadata(text, args.title, args.objective, args.status, updated_at)
    for section in SECTIONS:
        text = ensure_section(text, section)

    text = append_bullets(text, "Files Changed", split_csv(args.files), dedupe=True)
    text = append_bullets(text, "Validation", args.validation, dedupe=True)
    text = append_bullets(text, "React Doctor", args.react_doctor, dedupe=True)
    text = append_bullets(text, "Progress Log", args.note, timestamp=timestamp)
    text = append_bullets(text, "Open Questions", args.open_questions, dedupe=True)

    log_path.write_text(text.rstrip() + "\n", encoding="utf-8")
    print(str(log_path))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
