"""Extract plain text from every document in the profile's intake folder.

Writes one .txt per source into intake/.text/ so an agent can read old
resumes, LinkedIn exports, and reviews regardless of format. PDFs use pypdf,
DOCX is read directly from its XML, and .pages/.doc/.rtf fall back to macOS
`textutil` when available. Sources are never modified.

Usage: python engine/extract_intake.py
"""

import json
import os
import re
import shutil
import subprocess
import zipfile
from pathlib import Path

from pypdf import PdfReader

REPO_ROOT = Path(__file__).resolve().parent.parent


def profile_dir():
    env_dir = os.environ.get("RESUME_PROFILE_DIR")
    directory = Path(env_dir).resolve() if env_dir else REPO_ROOT / "profile"
    if not (directory / "profile.json").exists():
        raise SystemExit("No profile found. Run `npm run init` first.")
    return directory


def docx_text(path):
    with zipfile.ZipFile(path) as archive:
        xml = archive.read("word/document.xml").decode("utf-8", "ignore")
    xml = re.sub(r"</w:p>", "\n", xml)
    xml = re.sub(r"<w:tab/>", "\t", xml)
    return re.sub(r"<[^>]+>", "", xml)


def textutil_text(path):
    if not shutil.which("textutil"):
        return None
    result = subprocess.run(
        ["textutil", "-convert", "txt", "-stdout", str(path)], capture_output=True, text=True
    )
    return result.stdout if result.returncode == 0 else None


def extract(path):
    suffix = path.suffix.lower()
    if suffix == ".pdf":
        return "\n".join((page.extract_text() or "") for page in PdfReader(str(path)).pages)
    if suffix == ".docx":
        return docx_text(path)
    if suffix in {".md", ".txt"}:
        return path.read_text(encoding="utf-8", errors="ignore")
    if suffix in {".html", ".htm"}:
        return re.sub(r"<[^>]+>", " ", path.read_text(encoding="utf-8", errors="ignore"))
    return textutil_text(path)


intake = profile_dir() / "intake"
out_dir = intake / ".text"
out_dir.mkdir(parents=True, exist_ok=True)
report = []
for source in sorted(intake.iterdir()):
    if source.is_dir() or source.name.startswith(".") or source.name.lower() == "readme.md":
        continue
    try:
        text = extract(source)
    except Exception as error:  # report and keep going; one bad file should not stop intake
        text, note = None, f"failed: {error}"
    else:
        note = "ok" if text and text.strip() else "no text (scanned image? ask the user for another format)"
    if text and text.strip():
        (out_dir / f"{source.name}.txt").write_text(text, encoding="utf-8")
    report.append({"file": source.name, "characters": len(text or ""), "status": note})

print(json.dumps(report, indent=2))
