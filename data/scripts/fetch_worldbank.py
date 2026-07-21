"""
Fetch World Bank indicators and normalize to ISO3 country codes.
Indicators:
  - SP.POP.TOTL : Total population
  - NY.GDP.PCAP.CD : GDP per capita (current US$)
  - EN.ATM.CO2E.PC : CO2 emissions per capita (metric tons)
  - IT.NET.USER.ZS : Internet users (% of population)
Output: data/processed/worldbank.json
"""
import json
import urllib.request
from pathlib import Path

INDICATORS = {
    "population": "SP.POP.TOTL",
    "gdp_per_capita": "NY.GDP.PCAP.CD",
    "co2_per_capita": "EN.GHG.CO2.PC.CE.AR5",
    "internet_users_pct": "IT.NET.USER.ZS",
}

DATA_DIR = Path(__file__).parent.parent
PROCESSED_DIR = DATA_DIR / "processed"
RAW_DIR = DATA_DIR / "raw"

PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
RAW_DIR.mkdir(parents=True, exist_ok=True)


def fetch_indicator(code: str, name: str) -> dict:
    """Fetch latest available value for each country from World Bank API."""
    url = (
        f"https://api.worldbank.org/v2/country/all/indicator/{code}"
        f"?format=json&per_page=500&mrnev=1"
    )
    raw_path = RAW_DIR / f"worldbank_{name}.json"

    print(f"Fetching {name} ({code})...")
    if raw_path.exists():
        with open(raw_path) as f:
            data = json.load(f)
    else:
        req = urllib.request.Request(url, headers={"User-Agent": "ITWorldMap/1.0"})
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read())
        with open(raw_path, "w") as f:
            json.dump(data, f)

    results = {}
    if len(data) < 2:
        print(f"  WARNING: Unexpected response for {name}")
        return results

    for entry in data[1]:
        if entry.get("countryiso3code") and entry["value"] is not None:
            iso3 = entry["countryiso3code"]
            year = entry["date"]
            value = entry["value"]
            if iso3 not in results or year > results[iso3]["year"]:
                results[iso3] = {"value": value, "year": year}

    return {k: v["value"] for k, v in results.items()}


def main():
    output = {}

    for name, code in INDICATORS.items():
        values = fetch_indicator(code, name)
        for iso3, value in values.items():
            if iso3 not in output:
                output[iso3] = {"iso3": iso3}
            output[iso3][name] = value

    # Keep only countries with all indicators available
    countries = [
        entry for entry in output.values() if all(k in entry for k in INDICATORS)
    ]

    out_path = PROCESSED_DIR / "worldbank.json"
    with open(out_path, "w") as f:
        json.dump(countries, f, indent=2)

    print(f"\nDone: {len(countries)} countries → {out_path}")


if __name__ == "__main__":
    main()
