"""Production entrypoint for the recommender Flask service, served by waitress.

Waitress is a single-process, multi-threaded WSGI server, which fits this
app well: one process holds the ~350 MB FAISS index and the embedding model in
memory, and several threads handle the I/O-bound requests (calls out to the ML
API and Gemini). Because there is no forking, the SQLite connection opened in
initialize_rag() lives in the one process that serves requests.

The index is loaded eagerly before serving so the container is ready as soon as
it is up. If eager load fails, the app's lazy background-init path kicks in on
the first request instead of crashing the server.
"""

import os

from waitress import serve

from app import app, initialize_rag

if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "5000"))
    threads = int(os.getenv("THREADS", "4"))

    try:
        initialize_rag()
    except Exception as exc:  # noqa: BLE001
        print(f"Eager RAG init failed ({exc}); will lazy-load on first request.")

    print(f"Serving recommender on {host}:{port} with {threads} threads (waitress)")
    serve(app, host=host, port=port, threads=threads)
