"""Hämtar registret från Google Sheets och sparar det som kompakt JSON.

Användning:  python scripts/fetch_data.py
Filen site/data/landskapshandlingar.json skrivs bara om när innehållet ändrats,
så att "updated"-datumet speglar senaste faktiska ändring i källan.
"""

import csv
import io
import json
import sys
import urllib.request
from datetime import date
from pathlib import Path

SHEET_ID = "1SqcelFLCmrDJLUdYXyWL5wqbZchBRXxY"
URL = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv"
OUT = Path(__file__).resolve().parent.parent / "site" / "data" / "landskapshandlingar.json"

# Kolumner som är "JA"/tomt i källan -> sparas som true/false
FLAG_COLUMNS = [
    "Räkenskap(er)", "Årliga räntan", "Tiondelängd(er)", "Avkortningslängd(er)",
    "Ovissa persedlar", "Saköreslängd(er)", "Dombok", "Mantalsregister",
    "Förtäringsregister", "Löningsregister", "Inventarium", "Kungliga brev",
    "Kvittenser", "Sockenregister",
]
INT_COLUMNS = ["År", "Volym", "Häfte"]
REQUIRED = ["Arkiv", "År", "Bildlänk", "Område", *FLAG_COLUMNS]
MIN_ROWS = 10_000  # skydd mot att en trasig nedladdning skriver över datan


def convert(col: str, value: str):
    value = value.strip()
    if col in FLAG_COLUMNS:
        return value.upper() == "JA"
    if value == "":
        return None
    if col in INT_COLUMNS and value.isdigit():
        return int(value)
    return value


def main() -> int:
    with urllib.request.urlopen(URL, timeout=60) as resp:
        text = resp.read().decode("utf-8-sig")

    reader = csv.reader(io.StringIO(text))
    columns = [c.strip() for c in next(reader)]
    missing = [c for c in REQUIRED if c not in columns]
    if missing:
        print(f"Saknade kolumner i källan: {missing}", file=sys.stderr)
        return 1

    rows = [[convert(c, v) for c, v in zip(columns, r)] for r in reader if any(r)]
    if len(rows) < MIN_ROWS:
        print(f"För få rader ({len(rows)}) – avbryter.", file=sys.stderr)
        return 1

    if OUT.exists():
        old = json.loads(OUT.read_text(encoding="utf-8"))
        if old.get("columns") == columns and old.get("rows") == rows:
            print(f"Ingen förändring ({len(rows)} rader).")
            return 0

    payload = {
        "updated": date.today().isoformat(),
        "source": f"https://drive.google.com/file/d/{SHEET_ID}/view",
        "columns": columns,
        "rows": rows,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
    )
    print(f"Skrev {len(rows)} rader till {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
