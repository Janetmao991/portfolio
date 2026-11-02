"""R14: serve a key-free LexiAI build plus a tiny local stand-in for the Supabase calls the
signed-in screens make, so the Podcasts tab can be captured headlessly without real credentials.
Podcast rows come read-only from ~/lexiai/podcast/data (examples.db + corpus.db + clips.json),
the same files sync_examples.py uploads. Nothing is written anywhere; upserts are acknowledged and dropped.
Usage: python3 lexi-local.py <dist dir> <port>"""
import json, sqlite3, sys, re
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse, parse_qs, unquote

DIST, PORT = Path(sys.argv[1]), int(sys.argv[2])
DATA = Path.home() / "lexiai/podcast/data"
ex = sqlite3.connect(f"file:{DATA}/examples.db?mode=ro", uri=True, check_same_thread=False)
co = sqlite3.connect(f"file:{DATA}/corpus.db?mode=ro", uri=True, check_same_thread=False)
CLIPS = json.loads((DATA / "clips.json").read_text())
STATS = json.loads((Path(__file__).parent / "stats.json").read_text())
USER = {"id": "00000000-0000-4000-8000-000000000001", "aud": "authenticated", "role": "authenticated",
        "email": "reader@localhost", "app_metadata": {"provider": "email"}, "user_metadata": {}}


def examples_for(term, limit=12):
    rows = ex.execute("""select l.id, l.episode_id, l.text, l.before, l.after, l.start, l.end, x.rank
                         from examples x join lines l on l.id = x.line_id where x.lemma = ? order by x.rank limit ?""",
                      (term.strip().lower(), limit)).fetchall()
    out = []
    for lid, eid, text, before, after, start, end, rank in rows:
        show, kind, title, published, audio = co.execute(
            "select show, kind, title, published, audio_url from episodes where id = ?", (eid,)).fetchone()
        clip = CLIPS.get(str(lid))
        out.append(dict(text=text, before_text=before, after_text=after, clip_path=clip[0] if clip else None,
                        start_s=start, end_s=end, rank=rank, show=show, kind=kind, title=title,
                        published=published, audio_url=audio))
    return out


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

    def body(self):
        n = int(self.headers.get("Content-Length") or 0)
        return json.loads(self.rfile.read(n) or b"{}") if n else {}

    def do_POST(self):
        u = urlparse(self.path)
        if u.path.endswith("/rpc/podcast_examples_for"):
            return self.send_json(examples_for(self.body().get("term", "")))
        if "/storage/v1/object/sign/podcast-clips/" in u.path:
            self.body()
            path = unquote(u.path.split("/podcast-clips/", 1)[1])
            return self.send_json({"signedURL": f"/object/sign/podcast-clips/{path}"})
        self.body()
        return self.send_json([], 201)  # upserts: acknowledged, not stored

    def do_PATCH(self):
        self.body(); self.send_json([], 200)

    def do_GET(self):
        u = urlparse(self.path)
        q = parse_qs(u.query)
        if u.path.startswith("/sb/"):
            if u.path.endswith("/auth/v1/user"):
                return self.send_json(USER)
            if u.path.endswith("/rest/v1/podcast_examples"):
                lemmas = re.findall(r'"([^"]*)"|([^,()]+)', q.get("lemma", ["in.()"])[0][3:])
                lemmas = [a or b for a, b in lemmas]
                rows = []
                for lem in lemmas:
                    n = ex.execute("select count(*) from examples where lemma = ?", (lem.lower(),)).fetchone()[0]
                    rows += [{"lemma": lem.lower()}] * n
                return self.send_json(rows)
            if u.path.endswith("/rest/v1/user_stats"):
                return self.send_json([{"data": STATS}])
            return self.send_json([])
        if "/object/sign/podcast-clips/clips/" in u.path:  # audio, for completeness
            f = DATA / "clips" / Path(u.path).name
            if f.exists():
                data = f.read_bytes()
                self.send_response(200); self.send_header("Content-Type", "audio/mpeg")
                self.send_header("Content-Length", str(len(data))); self.end_headers(); self.wfile.write(data)
                return
        if not (DIST / u.path.lstrip("/")).is_file():
            self.path = "/index.html"  # SPA fallback
        return super().do_GET()


ThreadingHTTPServer(("127.0.0.1", PORT), H).serve_forever()
