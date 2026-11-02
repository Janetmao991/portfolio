"""R17: serve a key-free LexiSpeak build (built from a copy of ~/lexispeak without .env.local) for the portfolio captures.
- /anth/*  relays the app's Claude calls; this process adds ANTHROPIC_API_KEY from its own environment,
           so no key reaches the build, the page or a screenshot (same pattern as r16/lexi-local.py).
- /sb/*    a tiny stand-in for the Supabase calls the signed-in app makes: GET words returns words.json
           (word names from my real LexiAI notebook); upserts (the Can Speak write-back) are acknowledged and dropped.
Nothing is written anywhere. Usage: python3 ls-local.py <dist dir> <port>"""
import json, os, sys, urllib.request, urllib.error
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse

DIST, PORT = Path(sys.argv[1]), int(sys.argv[2])
WORDS = json.loads((Path(__file__).parent / "words.json").read_text())
USER = {"id": "00000000-0000-4000-8000-000000000001", "aud": "authenticated", "role": "authenticated",
        "email": "reader@localhost", "app_metadata": {"provider": "email"}, "user_metadata": {}}


class H(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=str(DIST), **k)

    def log_message(self, *a):
        pass

    def send_json(self, obj, code=200):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        for h, v in [("Access-Control-Allow-Origin", "*"), ("Access-Control-Allow-Headers", "*"),
                     ("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS")]:
            self.send_header(h, v)
        self.end_headers()

    def drain(self):
        n = int(self.headers.get("Content-Length") or 0)
        return self.rfile.read(n) if n else b""

    def relay_claude(self, path):
        data = self.drain()
        hdrs = {"content-type": "application/json", "x-api-key": os.environ["ANTHROPIC_API_KEY"],
                "anthropic-version": self.headers.get("anthropic-version", "2023-06-01")}
        if self.headers.get("anthropic-beta"):
            hdrs["anthropic-beta"] = self.headers["anthropic-beta"]
        req = urllib.request.Request("https://api.anthropic.com" + path, data=data, headers=hdrs, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                code, body = r.status, r.read()
        except urllib.error.HTTPError as e:
            code, body = e.code, e.read()
        print("claude", code, len(body), body[:600].decode("utf8", "replace"), flush=True)
        self.send_response(code)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if self.path.startswith("/anth/"):
            return self.relay_claude(self.path[len("/anth"):])
        self.drain()
        return self.send_json([], 201)  # upserts: acknowledged, not stored

    def do_PATCH(self):
        self.drain(); self.send_json([], 200)

    def do_GET(self):
        u = urlparse(self.path)
        if u.path.startswith("/sb/"):
            if u.path.endswith("/auth/v1/user"):
                return self.send_json(USER)
            if u.path.endswith("/rest/v1/words"):
                if "word=eq." in (u.query or ""):  # markSpokenWell's read-before-write: say "no row", so nothing is upserted
                    return self.send_json(None)
                return self.send_json([{"word": w, "data": d} for w, d in WORDS.items()])
            return self.send_json([])
        if not (DIST / u.path.lstrip("/")).is_file():
            self.path = "/index.html"  # SPA fallback
        return super().do_GET()


ThreadingHTTPServer(("127.0.0.1", PORT), H).serve_forever()
