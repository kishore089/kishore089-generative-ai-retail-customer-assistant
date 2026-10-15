"""Build individual deployment ZIPs with the shared helper included.

Usage from repository root:
    python backend/scripts/package_lambdas.py
Outputs ZIPs under backend/dist/. Does not deploy or modify AWS resources.
"""
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[2]
LAMBDAS = ROOT / "backend" / "lambdas"
SHARED = LAMBDAS / "_shared" / "retail_common.py"
DIST = ROOT / "backend" / "dist"
EXCLUDE = {"README.md", "__pycache__", ".DS_Store"}

def main():
    if not SHARED.exists():
        raise SystemExit(f"Missing shared helper: {SHARED}")
    DIST.mkdir(parents=True, exist_ok=True)
    count = 0
    for folder in sorted(p for p in LAMBDAS.iterdir() if p.is_dir() and not p.name.startswith("_")):
        handler = folder / "lambda_function.py"
        if not handler.exists():
            print(f"SKIP {folder.name}: no lambda_function.py")
            continue
        target = DIST / f"{folder.name}.zip"
        with zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED) as zf:
            zf.write(handler, "lambda_function.py")
            zf.write(SHARED, "retail_common.py")
            for p in folder.rglob("*"):
                if not p.is_file() or p == handler or any(part in EXCLUDE for part in p.parts):
                    continue
                zf.write(p, str(p.relative_to(folder)))
        print(f"Created {target.relative_to(ROOT)}")
        count += 1
    print(f"Built {count} deployment ZIP(s). Review each function's configuration before deploying.")

if __name__ == "__main__":
    main()
