#!/usr/bin/env python3
"""Export reviewed CRM source without local environments or dependencies."""

import argparse
from pathlib import Path
import shutil
import subprocess

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("destination", type=Path)
parser.add_argument("--worker", action="store_true", help="Build the server-only worker image")
args = parser.parse_args()
source = Path(__file__).resolve().parents[2]
destination = args.destination.resolve()
if destination.exists():
    parser.error("Destination must be new; existing files are never overwritten.")
if destination.is_relative_to(source):
    parser.error("Destination must be outside the CRM checkout.")

files = subprocess.check_output(
    ["git", "-c", "core.checkStat=minimal", "-c", "core.trustctime=false",
     "ls-files", "-z", "--cached", "--", "."],
    cwd=source,
).decode().split("\0")
destination.mkdir(parents=True)
count = 0
for name in files:
    if not name:
        continue
    path = Path(name)
    if args.worker and len(path.parts) >= 2 and path.parts[0] == "packages":
        if path.parts[1] not in {
            "twenty-server", "twenty-emails", "twenty-shared",
            "twenty-client-sdk", "twenty-oxlint-rules", "twenty-docker",
        }:
            continue
    if any(part in {"node_modules", ".git", ".nx", ".cache"} for part in path.parts):
        continue
    if (
        len(path.parts) >= 3
        and path.parts[0] == "packages"
        and path.parts[2] in {"dist", "build"}
    ):
        continue
    if any(part.startswith(".env") and not part.endswith(".example") for part in path.parts):
        continue
    original = source / path
    if original.is_symlink():
        if path == Path("AGENTS.md"):
            continue
        raise SystemExit(f"Refusing symlink in deployment source: {path}")
    target = destination / path
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(original, target)
    count += 1

dockerfile = (source / "packages/twenty-docker/twenty/Dockerfile").read_text()
if "# Target: twenty-aws" not in dockerfile or "FROM twenty-server AS twenty\n" not in dockerfile:
    raise SystemExit("Upstream Docker stages changed; review production export first.")
dockerfile = dockerfile.split("# Target: twenty-aws", 1)[0]
target = "twenty-server" if args.worker else "twenty"
(destination / "Dockerfile").write_text(dockerfile + f"\nFROM {target} AS bold\n")
(destination / ".dockerignore").write_text(
    ".git\n**/node_modules\n**/.env\n**/.env.*\npackages/*/dist\npackages/*/build\n**/.nx\n**/.cache\n"
)
print(f"Prepared {count} CRM source files at {destination}")
