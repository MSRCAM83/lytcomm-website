# MAP READING LESSONS LEARNED
## Auto-updated by Claude after each map extraction
## Last Updated: 2026-02-04
## Maps Processed: 0 (initialized)

---

## GENERAL RULES LEARNED

### PDF Upload Compression
- Claude.ai compresses uploaded PDFs: 1.47MB → 137KB (1372x896 pixels)
- ALWAYS fetch original PDFs from Google Drive using Gateway driveList + direct download
- Google Drive download URL format: `https://drive.google.com/uc?export=download&id={FILE_ID}`
- Render with PyMuPDF at 300-400 DPI for readable output (5100x3300 to 6800x4400)

### Tiling Strategy
- Tile map area (excluding legend) into 4x3 grid = 12 tiles minimum
- Crop legend separately from top-right ~28% width, top ~52% height
- Each tile should be ~900x1100+ pixels for text readability
- Use 400 DPI for maps with very dense text/numbers

### Text Layer vs Image
- Text layer contains: handhole IDs, segment references, splice types, duct specs, street names
- Text layer DOES NOT contain: footage paired to specific segments (spatial relationship)
- Image tiles contain: spatial layout, footage-to-segment pairing, color-coded cable routes
- ALWAYS use BOTH together for 100% data extraction

---

## VEXUS FIBER MAP PATTERNS

### Legend Location
- Top-right corner, below Vexus logo, above KEY MAP grid
- Three sections: Point Symbols, Cable Line Colors, Conduit Highlight Legend

### Handhole Labeling
- Hub handholes: Single letter (A, B, C, D, E, F) — large LHH (30x48x24)
- Terminal handholes: Letter + 2-digit number (A01, B08, F03) — small TB (15x20x12)
- Some mid-chain handholes use 17x30x18 B size
- Size is usually written next to the handhole in format: "15x20x12 TB" or "17x30x18 B"

### Splice Callout Format
- Text near each handhole reads: `15"x20"x12" SPLICE:SLPH.01.006-B01`
- Below that: `(1x4 Terminal): SLPH.01.006-B01-1 SLPH.01.006-B01-2 SLPH.01.006-B01-3`
- The `-1 -2 -3` suffixes are individual fiber equipment IDs at that location
- Count of equipment IDs = number of fiber equipments (2 or 3)

### Duct Placement Callout Format
- Rectangular text boxes along routes describe exact duct and cable specs
- Format: `PLACE 2 - 1.25" HDPE DUCTS W/(1) 48CT & (1) DROPS UG FIBER OPTIC CABLE`
- Followed by: `SLPH.01.006/A-B & B-B01` (segment reference)
- Then: `UG DUCT PLACEMENT BY DIRECTIONAL BORE`

### Segment Reference Format in Duct Callouts
- `SLPH.01.006/A-B` means hub A to hub B
- `SLPH.01.006/B-B01` means hub B to terminal B01
- `SLPH.01.006/A-B & B-B01` means both cables run through this segment
- The `&` indicates multiple cable runs sharing the same trench/duct path

### Section Color Boundaries
- Each section (A through F) is outlined in a distinct color on the map
- Yellow, pink, orange, red, green boundaries separate section areas
- Hub handholes sit at section intersections or entry points

### F1 Route
- "F1 Route Extns" labels appear along main feeder paths
- These are the 288ct or 432ct backbone routes connecting hubs
- F1 routes typically run along major roads (Hwy 90, W Parish Rd)

### Special Notations
- "THESE APARTMENTS WILL BE SERVED IN SPECIAL BUILD PROJECT" — excluded from this scope
- "PATTISON COMPLEX" type labels indicate large multi-unit properties
- Hatched/cross-hatched pink areas = excluded zones or special build areas

---

## PROJECT-SPECIFIC NOTES

### SLPH.01.006 (Sulphur, LA)
- 6 sections: A, B, C, D, E, F
- 48 terminal handholes (8 per section: X01 through X08)
- 6 hub handholes (A through F)
- All terminals are 15x20x12 TB with 1x4 splices
- Hub handholes are 30x48x24 LHH
- Some 17x30x18 B handholes at junction points
- Major streets: Highway 90 W, W Parish Rd, I-10 North Frontage Rd
- Pattison Complex area excluded (special build)
- F1 feeder routes run along Parish Rd and Hwy 90
- File on Drive: `1xlggTWzU5_kZ7VqiCqbY7n2rOAhDx9zR` (1.47MB)
- Also has Excel data file: `17xIi3egxanMKxEcv4GfqYBsr272BhZpE`

---

## COMMON MISTAKES TO AVOID
1. Never trust Claude.ai's compressed PDF — always fetch from Drive
2. Don't confuse BFO (blown) vs CO (copper optic) — both are valid cable types
3. Hub letters (A,B,C) are NOT the same as section letters — verify which is which
4. Footage numbers near segment text may belong to ADJACENT segments — verify spatially
5. The `-1 -2 -3` suffixes on splice IDs are fiber equipment counts, not splice counts
6. "2 SPLICES" callout means 2 splice operations at that handhole, not 2 fibers
7. Duct count (1X, 2X, 3X) is different from cable count — one duct can carry multiple cables
8. Always cross-reference text layer segment refs against visual tile data

---

## UPDATE LOG
- 2026-02-04: Initial creation from SLPH.01.006 analysis
