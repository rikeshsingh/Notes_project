# SRE / DevOps Interview Q&A (Static)

This is a static HTML/CSS/JS app containing Docker, Kubernetes, Terraform and SRE interview questions and answers. The project was simplified to run locally without Docker or Kubernetes.

Local quick runs (no Docker required)

- Python (built-in):

```bash
python run_server.py
# then open http://localhost:9000
```

- Node (built-in modules only):

```bash
node server.js
# then open http://localhost:9000
```

Files present:

- `index.html`, `styles.css`, `script.js` — static site
- `server.js` — simple Node static server (no dependencies)
- `run_server.py` — simple Python static server

Navigation:

- Open `index.html` (or start a server) to see the Home page with links to each topic.
- Click a topic (Docker, Kubernetes, Terraform, SRE) to open the dedicated page for that category.


Notes:

- You can also open `index.html` directly in a browser, but some browsers restrict loading local modules/resources for security.
- Docker/Kubernetes/Terraform files were removed per request.
