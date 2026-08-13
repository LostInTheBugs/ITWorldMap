"""
Fetch full yearly time series for all World Bank indicators.
Output: public/series.json — {indicatorKey: {iso3: {year: value}}}
Compact: values rounded to 4 decimals, only real countries (no aggregates).
"""
import json
import time
import urllib.request
from pathlib import Path

INDICATORS = {
    "population": "SP.POP.TOTL",
    "gdp_per_capita": "NY.GDP.PCAP.CD",
    "co2_per_capita": "EN.GHG.CO2.PC.CE.AR5",
    "internet_users_pct": "IT.NET.USER.ZS",
    "mobile_subscriptions_per100": "IT.CEL.SETS.P2",
    "fixed_broadband_per100": "IT.NET.BBND.P2",
    "electricity_access_pct": "EG.ELC.ACCS.ZS",
    "secure_servers_per_million": "IT.NET.SECR.P6",
}

PUBLIC_DIR = Path(__file__).parent.parent.parent / "public"


def fetch_real_countries() -> set[str]:
    url = "https://api.worldbank.org/v2/country?format=json&per_page=400"
    req = urllib.request.Request(url, headers={"User-Agent": "ITWorldMap/1.0"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = json.loads(resp.read())
    return {
        c["id"] for c in data[1]
        if c.get("region", {}).get("value") != "Aggregates"
        and c.get("id") and len(c["id"]) == 3
    }


def fetch_full_series(code: str, name: str) -> dict[str, dict[str, float]]:
    url = (
        f"https://api.worldbank.org/v2/country/all/indicator/{code}"
        f"?format=json&per_page=20000"
    )
    print(f"Fetching {name} ({code})...", flush=True)
    req = urllib.request.Request(url, headers={"User-Agent": "ITWorldMap/1.0"})
    with urllib.request.urlopen(req, timeout=120) as resp:
        data = json.loads(resp.read())
    if len(data) < 2:
        print(f"  WARNING: unexpected response for {name}")
        return {}
    series: dict[str, dict[str, float]] = {}
    for entry in data[1]:
        iso3 = entry.get("countryiso3code")
        if not iso3 or entry.get("value") is None:
            continue
        year = entry["date"]
        try:
            value = round(float(entry["value"]), 4)
        except (TypeError, ValueError):
            continue
        series.setdefault(iso3, {})[year] = value
    print(f"  {len(series)} pays, {sum(len(v) for v in series.values())} valeurs", flush=True)
    time.sleep(0.5)  # politesse API
    return series


def main() -> None:
    real = fetch_real_countries()
    print(f"Real countries: {len(real)}")

    out: dict[str, dict[str, dict[str, float]]] = {}
    for name, code in INDICATORS.items():
        series = fetch_full_series(code, name)
        out[name] = {iso3: years for iso3, years in series.items() if iso3 in real}

    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    out_path = PUBLIC_DIR / "series.json"
    with open(out_path, "w") as f:
        json.dump(out, f, separators=(",", ":"))
    size_mb = out_path.stat().st_size / 1e6
    print(f"\nDone → {out_path} ({size_mb:.2f} MB)")


if __name__ == "__main__":
    main()
