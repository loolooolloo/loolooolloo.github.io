# Laboratory Website

This repository is a static GitHub Pages website.

## Local preview

Because the site loads JSON with `fetch()`, do not open `index.html` by double-clicking it.
Run a local web server from the repository root:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Main data files

- `data/news.json`: news items
- `data/people.json`: professor and student cards
- `data/research.json`: research-area cards
- `data/publications.json`: journal papers, conference papers, and patents
- `data/lectures.json`: lecture cards

## Home-page controls

- News count: edit `HOME_NEWS_LIMIT` in `assets/js/main.js`
- People/research/lectures: set `"showOnHome": true` or `false`
- Publications: only items with `"showOnHome": true` appear on the home page

## GitHub Pages deployment

1. Push the files to a GitHub repository.
2. Open **Settings → Pages**.
3. Select **Deploy from a branch**.
4. Select the `main` branch and `/root`.
