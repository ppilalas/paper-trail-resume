import argparse
import json
import os
import re
import shutil
import subprocess
from pathlib import Path

from pypdf import PdfReader


REPO_ROOT = Path(__file__).resolve().parent.parent


def fail(message):
    raise SystemExit(f"FAIL: {message}")


def load_profile():
    """Mirror of engine/profile.js: RESUME_PROFILE_DIR, then ./profile."""
    env_dir = os.environ.get("RESUME_PROFILE_DIR")
    profile_dir = Path(env_dir).resolve() if env_dir else REPO_ROOT / "profile"
    profile_json = profile_dir / "profile.json"
    if not profile_json.exists():
        fail(
            "No profile found. Copy profile.example/ to profile/ or set "
            f"RESUME_PROFILE_DIR (looked in {profile_dir})"
        )
    raw = json.loads(profile_json.read_text(encoding="utf-8"))
    name = raw["name"].strip()
    contact = raw.get("contact", {})
    return {
        "name": name,
        "filename_prefix": raw.get("filenamePrefix") or "-".join(name.split()) + "-Resume",
        "output_dir": (profile_dir / raw.get("outputDir", "output")).resolve(),
        "required_text": [
            name,
            *(contact[key] for key in ("email", "phone", "linkedin", "portfolio") if contact.get(key)),
            *raw.get("requiredText", []),
        ],
        "min_links": raw.get("minLinks", 4),
    }


profile = load_profile()
FILENAME_RE = re.compile(
    rf"^{re.escape(profile['filename_prefix'])}-[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*-\d{{4}}-\d{{2}}-\d{{2}}\.pdf$"
)

parser = argparse.ArgumentParser(description="Validate a Paper Trail resume PDF.")
parser.add_argument("pdf", type=Path)
parser.add_argument("--expect", action="append", default=[], help="Required text; repeat as needed")
parser.add_argument("--qa-dir", type=Path, help="Write extracted text and rendered page PNGs here")
args = parser.parse_args()

pdf = args.pdf.resolve()
if not pdf.exists():
    fail(f"PDF not found: {pdf}")
if pdf.parent != profile["output_dir"]:
    fail(f"Final PDF must live directly in the profile output folder {profile['output_dir']}: {pdf}")
if not FILENAME_RE.fullmatch(pdf.name):
    fail(f"Filename does not match the required convention: {pdf.name}")

reader = PdfReader(str(pdf))
if len(reader.pages) != 2:
    fail(f"Expected 2 pages, found {len(reader.pages)}")

for index, page in enumerate(reader.pages, start=1):
    width = float(page.mediabox.width)
    height = float(page.mediabox.height)
    if abs(width - 612) > 1 or abs(height - 792) > 1:
        fail(f"Page {index} is not US Letter: {width} x {height} points")

root = reader.trailer["/Root"]
mark_info = root.get("/MarkInfo")
if not mark_info or not mark_info.get_object().get("/Marked"):
    fail("PDF is not tagged")

text = "\n".join((page.extract_text() or "") for page in reader.pages)
if len(text) < 3500:
    fail(f"Extracted text is unexpectedly short: {len(text)} characters")

for required in (*profile["required_text"], *args.expect):
    if required.lower() not in text.lower():
        fail(f"Required text is missing: {required}")

link_count = 0
for page in reader.pages:
    for annotation in page.get("/Annots") or []:
        if annotation.get_object().get("/Subtype") == "/Link":
            link_count += 1
if link_count < profile["min_links"]:
    fail(f"Expected at least {profile['min_links']} link annotations, found {link_count}")

title = str((reader.metadata or {}).get("/Title") or "").strip()
if not title or profile["name"] not in title:
    fail(f"Missing or invalid PDF title metadata: {title!r}")

if args.qa_dir:
    qa_dir = args.qa_dir.resolve()
    qa_dir.mkdir(parents=True, exist_ok=True)
    (qa_dir / "extracted.txt").write_text(text, encoding="utf-8")
    pdftoppm = os.environ.get("PDFTOPPM") or shutil.which("pdftoppm")
    if not pdftoppm:
        fail("pdftoppm was not found (install poppler or set PDFTOPPM); visual QA pages could not be created")
    subprocess.run(
        [pdftoppm, "-png", "-r", "150", str(pdf), str(qa_dir / "page")],
        check=True,
    )
    rendered = sorted(qa_dir.glob("page-*.png"))
    if len(rendered) != 2:
        fail(f"Expected 2 rendered PNGs, found {len(rendered)}")

print(f"PASS: {pdf}")
print(f"Pages: 2 | Tagged: yes | Links: {link_count} | Extracted characters: {len(text)}")
if args.qa_dir:
    print(f"QA artifacts: {args.qa_dir.resolve()}")
