# Wireless Communications Laboratory Website

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

## Shared sidebar

Edit only:

```text
_includes/sidebar.html
```

All pages reuse it through:

```liquid
{% include sidebar.html %}
```
