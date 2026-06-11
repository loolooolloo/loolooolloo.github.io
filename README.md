# Laboratory Website

The visual design is preserved from the original single-file HTML.

## Content management

- `data/news.json`
- `data/people.json`
- `data/research.json`
- `data/publications.json`
- `data/lectures.json`

Only publication items with `"showOnHome": true` are shown on the home page.

The number of news items shown on the home page is controlled by:

```javascript
const HOME_NEWS_LIMIT = 5;
```

in `assets/js/main.js`.

## Local preview

Run this command in the project root:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.
