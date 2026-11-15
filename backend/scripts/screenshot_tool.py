"""
Screenshot and DOM inspection utility using headless Chrome and CDP.
"""
import asyncio
import base64
import json
import os
import subprocess
import time
import urllib.request
import websockets

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
DEFAULT_OUT_DIR = r"C:\Users\MrIPS\.gemini\antigravity\brain\a0aff26e-132a-4b69-a86a-c800f8f5518e\screenshots"


async def capture_element(url, selector, width, height, output_file, wait_seconds=3.0):
    port = 9235
    proc = subprocess.Popen([
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        f"--remote-debugging-port={port}",
        f"--window-size={width},{height}",
        url,
    ])
    await asyncio.sleep(wait_seconds)
    try:
        tabs = json.loads(urllib.request.urlopen(f"http://127.0.0.1:{port}/json").read().decode())
        ws_url = tabs[0]["webSocketDebuggerUrl"]
        async with websockets.connect(ws_url) as ws:
            msg_dbg = {"id": 0, "method": "Runtime.evaluate", "params": {"expression": "({ href: location.href, title: document.title, text: document.body.innerText.slice(0, 200) })", "returnByValue": True}}
            await ws.send(json.dumps(msg_dbg))
            resp_dbg = json.loads(await ws.recv())
            print("Debug Page Info:", resp_dbg.get("result", {}).get("result", {}).get("value"))
            eval_js = f"""
            (() => {{
                const el = document.querySelector('{selector}');
                if (!el) return null;
                const r = el.getBoundingClientRect();
                return {{
                    x: Math.max(0, r.left + window.pageXOffset),
                    y: Math.max(0, r.top + window.pageYOffset),
                    width: r.width,
                    height: r.height
                }};
            }})()
            """
            msg = {"id": 1, "method": "Runtime.evaluate", "params": {"expression": eval_js, "returnByValue": True}}
            await ws.send(json.dumps(msg))
            resp = json.loads(await ws.recv())
            rect = resp.get("result", {}).get("result", {}).get("value")
            print("Element rect:", rect)

            # Capture screenshot
            params = {"format": "png", "captureBeyondViewport": True}
            if rect and rect["width"] > 0 and rect["height"] > 0:
                params["clip"] = {
                    "x": rect["x"],
                    "y": rect["y"],
                    "width": rect["width"],
                    "height": rect["height"],
                    "scale": 1,
                }

            msg2 = {"id": 2, "method": "Page.captureScreenshot", "params": params}
            await ws.send(json.dumps(msg2))
            resp2 = json.loads(await ws.recv())
            img_data = base64.b64decode(resp2["result"]["data"])
            os.makedirs(os.path.dirname(output_file), exist_ok=True)
            with open(output_file, "wb") as f:
                f.write(img_data)
            print(f"Captured: {output_file} ({len(img_data)} bytes)")
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=2)
        except Exception:
            proc.kill()


if __name__ == "__main__":
    import sys
    url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5173/"
    selector = sys.argv[2] if len(sys.argv) > 2 else ".landing-domains"
    w = int(sys.argv[3]) if len(sys.argv) > 3 else 1920
    h = int(sys.argv[4]) if len(sys.argv) > 4 else 1080
    filename = sys.argv[5] if len(sys.argv) > 5 else "element.png"
    wait_sec = float(sys.argv[6]) if len(sys.argv) > 6 else 4.5
    out_file = os.path.join(DEFAULT_OUT_DIR, filename)
    asyncio.run(capture_element(url, selector, w, h, out_file, wait_seconds=wait_sec))
