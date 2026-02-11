"""
LYT Communications - Work Order Extraction Tool
CLI entry point with GUI file picker.

Usage:
    python extract_workorder.py
    python extract_workorder.py --wo path/to/workorder.pdf --map path/to/map.pdf
    python extract_workorder.py --wo path/to/workorder.pdf  (no map)

Double-click run.bat for the easiest launch.
"""

import argparse
import json
import os
import subprocess
import sys
import time
from pathlib import Path

# Find the .env.local file (up one level from tools/)
REPO_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = REPO_DIR / ".env.local"
OUTPUT_DIR = REPO_DIR / "tools" / "output"


def load_api_key() -> str:
    """Load ANTHROPIC_API_KEY from .env.local."""
    if not ENV_FILE.exists():
        print(f"ERROR: {ENV_FILE} not found.")
        print("Create it with: ANTHROPIC_API_KEY=sk-ant-...")
        sys.exit(1)

    with open(ENV_FILE, "r") as f:
        for line in f:
            line = line.strip()
            if line.startswith("ANTHROPIC_API_KEY"):
                _, _, value = line.partition("=")
                value = value.strip().strip('"').strip("'")
                if value:
                    return value

    print("ERROR: ANTHROPIC_API_KEY not found in .env.local")
    sys.exit(1)


def pick_file(title: str, required: bool = True) -> str | None:
    """Open a file picker dialog. Returns path or None."""
    try:
        import tkinter as tk
        from tkinter import filedialog

        root = tk.Tk()
        root.withdraw()
        root.attributes("-topmost", True)

        path = filedialog.askopenfilename(
            title=title,
            filetypes=[("PDF files", "*.pdf"), ("All files", "*.*")],
        )
        root.destroy()

        if path:
            return path
        if required:
            print("No file selected. Exiting.")
            sys.exit(0)
        return None
    except ImportError:
        print("tkinter not available. Use --wo and --map arguments instead.")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description="LYT Work Order Extraction Tool")
    parser.add_argument("--wo", help="Path to work order PDF")
    parser.add_argument("--map", help="Path to construction map PDF (optional)")
    parser.add_argument("--output", help="Output directory", default=str(OUTPUT_DIR))
    args = parser.parse_args()

    print()
    print("=" * 60)
    print("  LYT Communications - Work Order Extractor")
    print("  Powered by Claude Opus 4.6")
    print("=" * 60)
    print()

    # Load API key
    api_key = load_api_key()
    print(f"API key loaded from {ENV_FILE.name}")

    # Get file paths
    wo_path = args.wo
    map_path = args.map

    if not wo_path:
        print("Select the WORK ORDER PDF...")
        wo_path = pick_file("Select Work Order PDF", required=True)

    if not map_path and not args.wo:
        print("\nSelect the CONSTRUCTION MAP PDF (or Cancel to skip)...")
        map_path = pick_file("Select Construction Map PDF (optional)", required=False)

    if not wo_path or not os.path.exists(wo_path):
        print(f"ERROR: Work order file not found: {wo_path}")
        sys.exit(1)

    print(f"\nWork Order: {os.path.basename(wo_path)}")
    if map_path:
        print(f"Map:        {os.path.basename(map_path)}")
    else:
        print("Map:        (none)")

    # Import processing modules
    from pdf_processor import extract_work_order_text, tile_map_pdf, extract_map_text
    from claude_client import extract_with_claude

    # Step 1: Extract work order text
    print("\n[1/3] Extracting work order text...")
    start = time.time()
    wo_text = extract_work_order_text(wo_path)
    print(f"  {len(wo_text)} characters extracted ({time.time() - start:.1f}s)")

    if len(wo_text) < 30:
        print("WARNING: Very little text extracted from work order.")
        print("The PDF may be scanned/image-based. Extraction quality may be limited.")

    # Step 2: Process map (if provided)
    map_tiles = []
    map_text = ""
    if map_path and os.path.exists(map_path):
        print("\n[2/3] Processing construction map...")
        start = time.time()
        map_tiles = tile_map_pdf(map_path)
        map_text = extract_map_text(map_path)
        elapsed = time.time() - start
        total_mb = sum(len(t["base64"]) * 3 / 4 for t in map_tiles) / (1024 * 1024)
        print(f"  {len(map_tiles)} tiles ({total_mb:.1f}MB) in {elapsed:.1f}s")
    else:
        print("\n[2/3] No map PDF — skipping map processing")

    # Step 3: Call Claude for extraction
    print("\n[3/3] Sending to Claude Opus 4.6 for extraction...")
    print("  This may take 1-3 minutes depending on document complexity.")
    start = time.time()

    try:
        extracted = extract_with_claude(wo_text, map_text, map_tiles, api_key)
    except Exception as e:
        print(f"\nERROR: Extraction failed: {e}")
        sys.exit(1)

    elapsed = time.time() - start
    print(f"  Extraction complete ({elapsed:.1f}s)")

    # Derive output filename from job code
    job_code = "unknown"
    if extracted.get("project", {}).get("work_order_number"):
        job_code = extracted["project"]["work_order_number"]
    elif extracted.get("project", {}).get("name"):
        job_code = extracted["project"]["name"]
    # Sanitize for filename
    safe_name = "".join(c if c.isalnum() or c in ".-_" else "_" for c in job_code)

    # Save output
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)
    output_file = output_dir / f"{safe_name}_extraction.json"

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(extracted, f, indent=2, ensure_ascii=False)

    print(f"\n{'=' * 60}")
    print(f"  EXTRACTION COMPLETE")
    print(f"{'=' * 60}")

    # Print summary
    proj = extracted.get("project", {})
    segments = extracted.get("segments", [])
    structures = extracted.get("structures", [])
    splices = extracted.get("splice_points", [])
    line_items = extracted.get("line_items", [])
    recon = extracted.get("reconciliation", {})

    print(f"\n  Project:      {proj.get('name', '—')}")
    print(f"  Client:       {proj.get('client', '—')}")
    print(f"  Location:     {proj.get('location', '—')}")
    print(f"  WO Number:    {proj.get('work_order_number', '—')}")
    print(f"\n  Segments:     {len(segments)}")
    print(f"  Structures:   {len(structures)}")
    print(f"  Splice Pts:   {len(splices)}")
    print(f"  Line Items:   {len(line_items)}")

    total_footage = recon.get("total_footage", 0)
    if not total_footage:
        total_footage = sum(s.get("footage", 0) for s in segments)
    print(f"  Total Footage: {total_footage:,.0f} LF")

    unmatched = recon.get("unmatched_items", [])
    if unmatched:
        print(f"\n  Unmatched items: {', '.join(str(u) for u in unmatched)}")

    notes = recon.get("notes", [])
    if notes:
        print(f"\n  Notes:")
        for note in notes[:5]:
            print(f"    - {note}")

    print(f"\n  Output: {output_file}")
    print()
    print("  Next step: Paste this JSON into lytcomm.com -> JSON Import")
    print(f"{'=' * 60}")

    # Open output folder
    try:
        if sys.platform == "win32":
            os.startfile(str(output_dir))
        elif sys.platform == "darwin":
            subprocess.run(["open", str(output_dir)])
        else:
            subprocess.run(["xdg-open", str(output_dir)])
    except Exception:
        pass  # Non-critical


if __name__ == "__main__":
    main()
