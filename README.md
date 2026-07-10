A minimal Jekyll portfolio and blog hosted with GitHub Pages.

## How It Works

Jekyll builds the files in this repository into a static website:

- `index.html` contains the portfolio homepage.
- `_layouts/` contains shared HTML used by every page.
- `_includes/` contains the shared navigation and footer.
- `_posts/` contains blog posts.
- `styles.css` contains the site styling.
- `_config.yml` contains site-wide settings.

GitHub Pages runs the Jekyll build when changes are pushed to the publishing branch.

## Writing A Blog Post

Create a Markdown file in `_posts/`. Its filename must use this format:

```text
YYYY-MM-DD-short-title.md
```

Start the file with front matter, then write normal Markdown:

```markdown
---
layout: post
title: "Post title"
summary: "A short description shown below the title."
---

Write the post here.

## A heading

Markdown supports **bold text**, links, lists, and code blocks.
```

The homepage blog list is generated automatically, newest first.

## Local Preview

Local preview requires Ruby and Bundler. Ruby is not included in this repository.

```powershell
bundle install
bundle exec jekyll serve
```

Open `http://127.0.0.1:4000/`.

## GitHub Pages

For this user site, configure **Settings > Pages** to deploy from the repository's publishing branch (normally `main`) and the repository root. No custom GitHub Actions workflow is required.
