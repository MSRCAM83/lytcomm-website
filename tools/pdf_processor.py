"""
LYT Communications - PDF Processor
Extracts text from work order PDFs and tiles map PDFs into high-res sections.
Replicates the tiling logic from JobImportPage.js.
"""

import base64
import io
import fitz  # PyMuPDF
from PIL import Image

# Map tiling constants — must match JobImportPage.js
MAP_RENDER_SCALE = 2.5
MAP_JPEG_QUALITY = 70  # PIL uses 1-95 scale (70 = 0.70 in JS)
TILE_COLS = 2
TILE_ROWS = 2
LEGEND_X_RATIO = 0.72
LEGEND_TOP_RATIO = 0.0
LEGEND_BOTTOM_RATIO = 0.55

MAX_PAGES_WORKORDER = 10
MAX_PAGES_MAP = 4


def extract_work_order_text(pdf_path: str) -> str:
    """Extract text from work order PDF, preserving line structure."""
    doc = fitz.open(pdf_path)
    pages_to_read = min(doc.page_count, MAX_PAGES_WORKORDER)
    full_text = ""

    for i in range(pages_to_read):
        page = doc[i]
        text = page.get_text("text")
        if text and len(text.strip()) > 5:
            full_text += f"\n--- Page {i + 1} ---\n{text.strip()}"

    if doc.page_count > MAX_PAGES_WORKORDER:
        full_text += f"\n\n[NOTE: PDF has {doc.page_count} pages but only first {MAX_PAGES_WORKORDER} were processed]"

    doc.close()
    return full_text.strip()


def _render_page_to_image(page, scale: float) -> Image.Image:
    """Render a PDF page to a PIL Image at given scale."""
    mat = fitz.Matrix(scale, scale)
    pix = page.get_pixmap(matrix=mat, alpha=False)
    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
    return img


def _crop_to_base64(img: Image.Image, x: int, y: int, w: int, h: int, quality: int) -> str:
    """Crop a region from an image and return base64 JPEG."""
    cropped = img.crop((x, y, x + w, y + h))
    buffer = io.BytesIO()
    cropped.save(buffer, format="JPEG", quality=quality)
    return base64.b64encode(buffer.getvalue()).decode("ascii")


def tile_map_pdf(pdf_path: str) -> list[dict]:
    """
    Render map PDF pages at high resolution and tile into sections.
    Returns list of { 'base64': str, 'label': str } dicts.
    Replicates JobImportPage.js tileMapPage() logic.
    """
    doc = fitz.open(pdf_path)
    pages_to_render = min(doc.page_count, MAX_PAGES_MAP)
    all_tiles = []

    for i in range(pages_to_render):
        page_num = i + 1
        print(f"  Map page {page_num}/{pages_to_render}: rendering at {MAP_RENDER_SCALE}x...")
        page = doc[i]
        img = _render_page_to_image(page, MAP_RENDER_SCALE)
        W, H = img.size
        print(f"  Full canvas: {W}x{H}")

        # 1. Legend crop (right portion, top half)
        legend_x = int(W * LEGEND_X_RATIO)
        legend_y = int(H * LEGEND_TOP_RATIO)
        legend_w = W - legend_x
        legend_h = int(H * LEGEND_BOTTOM_RATIO) - legend_y

        if legend_w > 100 and legend_h > 100:
            b64 = _crop_to_base64(img, legend_x, legend_y, legend_w, legend_h, MAP_JPEG_QUALITY)
            label = f"Page {page_num} - LEGEND"
            all_tiles.append({"base64": b64, "label": label})
            size_kb = len(b64) * 3 // 4 // 1024
            print(f"  {label}: {legend_w}x{legend_h} = {size_kb}KB")

        # 2. Key Map crop (right portion, bottom half)
        key_y = int(H * LEGEND_BOTTOM_RATIO)
        key_w = W - legend_x
        key_h = H - key_y

        if key_w > 100 and key_h > 100:
            b64 = _crop_to_base64(img, legend_x, key_y, key_w, key_h, MAP_JPEG_QUALITY)
            label = f"Page {page_num} - KEY MAP"
            all_tiles.append({"base64": b64, "label": label})
            size_kb = len(b64) * 3 // 4 // 1024
            print(f"  {label}: {key_w}x{key_h} = {size_kb}KB")

        # 3. Map area tiles (left portion, full height, TILE_COLS x TILE_ROWS grid)
        map_w = int(W * LEGEND_X_RATIO)
        map_h = H
        tile_w = map_w // TILE_COLS
        tile_h = map_h // TILE_ROWS

        for row in range(TILE_ROWS):
            for col in range(TILE_COLS):
                tx = col * tile_w
                ty = row * tile_h
                tw = (map_w - tx) if col == TILE_COLS - 1 else tile_w
                th = (map_h - ty) if row == TILE_ROWS - 1 else tile_h

                label = f"Page {page_num} - Section R{row + 1}C{col + 1}"
                b64 = _crop_to_base64(img, tx, ty, tw, th, MAP_JPEG_QUALITY)
                all_tiles.append({"base64": b64, "label": label})
                size_kb = len(b64) * 3 // 4 // 1024
                print(f"  {label}: {tw}x{th} = {size_kb}KB")

    doc.close()
    total_mb = sum(len(t["base64"]) * 3 / 4 for t in all_tiles) / (1024 * 1024)
    print(f"  Total: {len(all_tiles)} tiles, {total_mb:.1f}MB")
    return all_tiles


def extract_map_text(pdf_path: str) -> str:
    """Extract embedded text from map PDF (supplementary to images)."""
    doc = fitz.open(pdf_path)
    pages_to_read = min(doc.page_count, MAX_PAGES_MAP)
    full_text = ""

    for i in range(pages_to_read):
        page = doc[i]
        text = page.get_text("text")
        if text and len(text.strip()) > 5:
            full_text += f"\n--- Map Page {i + 1} ---\n{text.strip()}"

    doc.close()
    return full_text.strip()
