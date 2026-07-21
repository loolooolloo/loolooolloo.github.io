# Wireless Intelligence and Optimization Lab. Website

## Windows local setup

1. Install Ruby+Devkit from RubyInstaller.
2. Close and reopen PowerShell.
3. Check:

```powershell
ruby -v
gem -v
```

4. Install Bundler:

```powershell
gem install bundler
bundle -v
```

5. In the project folder:

```powershell
bundle install
bundle exec jekyll serve --livereload
```

6. Open:

```text
http://127.0.0.1:4000
```

## Main content files

- `data/news.json`
- `data/people.json`
- `data/research.json`
- `data/publications.json`
- `data/lectures.json`
- `data/site.json`

## News data notes

`data/news.json` uses a single `date` field instead of separate `year`, `month`, and `day` fields. Use the `YYYY-MM-DD` format so sorting and display remain consistent.

Example:

```json
{
  "id": "news-2026-07-01",
  "date": "2026-07-01",
  "title": "News title",
  "image": "",
  "imageAlt": "",
  "content": ["News body text."]
}
```

## Lecture data notes

`data/lectures.json` is intentionally simple. Lecture detail pages are not currently used.

Each lecture item should use only:

- `period`: course period or semester label. It may be left empty until the exact period is decided.
- `name`: course name.
- `level`: use `undergraduate` or `graduate`.
- `showOnHome`: set `false` to hide the lecture from the home page while keeping it on `/lectures/`.

Example:

```json
{
  "period": "2026 Spring",
  "name": "Wireless Communications",
  "level": "undergraduate",
  "showOnHome": true
}
```

## People data notes

`data/people.json` controls the people cards and detail pages.

- `research`: short research-interest items shown on the main page profile card.
- `researchDetail`: detailed research-interest items shown on the person detail page.
- `profileLines`: business-card-style profile lines shown on the person detail page. Use `_blank` as a spacer line when a visual gap is needed.
- `education` and `experience`: each item uses `period`, `title`, and `description`. `description` may be either a string or an array of strings for multiline descriptions, such as advisor or supervisor notes.

Example:

```json
"profileLines": [
  "Assistant Professor",
  "Department of Artificial Intelligence Engineering",
  "Changwon National University",
  "_blank",
  "E-mail: name@example.edu",
  "Tel: +82-00-000-0000"
]
```

## Shared sidebar

Edit only:

```text
_includes/sidebar.html
```

All pages reuse it through:

```liquid
{% include sidebar.html %}
```


## Data validation

Run the JSON consistency checker before publishing content changes:

```sh
node scripts/validate-data.js
```

The checker fails on broken JSON, duplicate IDs, invalid categories/types, missing detail pages, and broken publication references. Missing image assets are reported as warnings so placeholder content can still be staged while the site remains buildable.
