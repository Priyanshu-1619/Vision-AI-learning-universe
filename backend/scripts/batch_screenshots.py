"""
Batch screenshot capture utility for UI verification.
Captures Fix 1 (Landing Domains) and Fix 2 (Laboratory Studio) across 6 resolutions.
"""
import asyncio
import os
import sys

# Ensure backend/scripts is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from screenshot_tool import capture_element, DEFAULT_OUT_DIR

RESOLUTIONS = [
    (1920, 1080, "1920"),
    (1440, 900, "1440"),
    (1280, 800, "1280"),
    (1024, 768, "1024"),
    (768, 1024, "768"),
    (390, 844, "390"),
]

async def run_batch():
    print("--- Capturing Fix 1: Landing Domains ---")
    for w, h, label in RESOLUTIONS:
        filename = f"after_domains_{label}.png"
        out_file = os.path.join(DEFAULT_OUT_DIR, filename)
        print(f"Capturing Domains at {w}x{h} -> {filename}...")
        try:
            await capture_element("http://localhost:5173/", ".landing-domains", w, h, out_file, wait_seconds=3.0)
        except Exception as e:
            print(f"Error capturing {filename}: {e}")

    print("\n--- Capturing Fix 2: AI Laboratory ---")
    for w, h, label in RESOLUTIONS:
        filename = f"after_lab_{label}.png"
        out_file = os.path.join(DEFAULT_OUT_DIR, filename)
        print(f"Capturing Laboratory at {w}x{h} -> {filename}...")
        try:
            await capture_element("http://localhost:5173/laboratory", ".lab-module-grid", w, h, out_file, wait_seconds=4.5)
        except Exception as e:
            print(f"Error capturing {filename}: {e}")

if __name__ == "__main__":
    asyncio.run(run_batch())
