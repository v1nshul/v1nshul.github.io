# Vanshul Kumar Portfolio

Static portfolio and blog site for Vanshul Kumar.

## Local Preview

Run a local static server from the repository root:

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Open:

```text
http://127.0.0.1:4173/
```

## Deploying To Vercel

This is a static HTML/CSS site. In Vercel, import the GitHub repository and use:

- Framework Preset: `Other`
- Build Command: leave empty
- Output Directory: `.`
- Install Command: leave empty

Vercel will serve `index.html` from the repository root.
