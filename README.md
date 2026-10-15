# Landskapshandlingar

Sökbart register över landskapshandlingar i Riksarkivet, sammankopplat med NAD.
Helt statisk sida (HTML + [DataTables](https://datatables.net/)) som publiceras via GitHub Pages.

Den tidigare Shiny-appen finns kvar i branchen [`shiny-app`](../../tree/shiny-app).

## Struktur

| Sökväg | Innehåll |
|---|---|
| `site/` | Själva webbplatsen (det som publiceras) |
| `site/data/landskapshandlingar.json` | Registret som kolumnnamn + rader (JA-kolumner som `true`/`false`) |
| `scripts/fetch_data.py` | Hämtar Google-arket och skriver JSON-filen (bara standardbiblioteket) |
| `.github/workflows/deploy.yml` | Uppdaterar data och publicerar till Pages |

## Uppdatera data

**Actions → "Uppdatera data och publicera" → Run workflow.** Arbetsflödet hämtar arket,
committar JSON-filen om något ändrats och publicerar sidan. Pushar som ändrar `site/`
publicerar sidan utan att hämta ny data.

Lokalt:

```sh
python scripts/fetch_data.py
python -m http.server --directory site
```

## Första gången

Settings → Pages → *Build and deployment* → Source: **GitHub Actions**.
