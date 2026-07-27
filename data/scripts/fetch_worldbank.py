"""
Fetch World Bank indicators and normalize to ISO3 country codes.
Indicators:
  - SP.POP.TOTL : Total population
  - NY.GDP.PCAP.CD : GDP per capita (current US$)
  - EN.GHG.CO2.PC.CE.AR5 : CO2 emissions per capita (metric tons)
  - IT.NET.USER.ZS : Internet users (% of population)
  - IT.CEL.SETS.P2 : Mobile subscriptions per 100 people
  - IT.NET.BBND.P2 : Fixed broadband subscriptions per 100 people
  - EG.ELC.ACCS.ZS : Access to electricity (% of population)
  - IT.NET.SECR.P6 : Secure Internet servers per 1 million people
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
    "mobile_subscriptions_per100": "IT.CEL.SETS.P2",
    "fixed_broadband_per100": "IT.NET.BBND.P2",
    "electricity_access_pct": "EG.ELC.ACCS.ZS",
    "secure_servers_per_million": "IT.NET.SECR.P6",
}

CORE_INDICATORS = ["population", "gdp_per_capita"]

DATA_DIR = Path(__file__).parent.parent
PROCESSED_DIR = DATA_DIR / "processed"
RAW_DIR = DATA_DIR / "raw"

PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
RAW_DIR.mkdir(parents=True, exist_ok=True)


def fetch_real_countries() -> set[str]:
    """Fetch the set of real country ISO3 codes (excluding regional aggregates)."""
    url = "https://api.worldbank.org/v2/country?format=json&per_page=400"
    req = urllib.request.Request(url, headers={"User-Agent": "ITWorldMap/1.0"})
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read())
    return {
        c["id"] for c in data[1]
        if c.get("region", {}).get("value") != "Aggregates"
        and c.get("id") and len(c["id"]) == 3
    }


def fetch_indicator(code: str, name: str) -> dict:
    """Fetch latest available value for each country from World Bank API."""
    url = (
        f"https://api.worldbank.org/v2/country/all/indicator/{code}"
        f"?format=json&per_page=20000"
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

    if not results:
        print(f"  ⚠️  AUCUNE donnée pour {name} ({code}) — indicateur à vérifier/retirer")

    # Return both value and year
    return {k: {"value": v["value"], "year": v["year"]} for k, v in results.items()}


def main():
    real_countries = fetch_real_countries()
    print(f"Real countries from World Bank: {len(real_countries)}")

    output = {}

    for name, code in INDICATORS.items():
        results = fetch_indicator(code, name)
        for iso3, entry in results.items():
            if iso3 not in output:
                output[iso3] = {"iso3": iso3}
            output[iso3][name] = entry["value"]
            output[iso3][f"{name}_year"] = entry["year"]

    # Keep only real countries with core indicators available
    countries = [
        entry for entry in output.values()
        if all(k in entry for k in CORE_INDICATORS)
        and entry["iso3"] in real_countries
    ]

    out_path = PROCESSED_DIR / "worldbank.json"
    with open(out_path, "w") as f:
        json.dump(countries, f, indent=2)

    excluded = len(output) - len(countries)
    print(f"\nDone: {len(countries)} countries (+ {excluded} aggregates excluded) → {out_path}")


if __name__ == "__main__":
    main()
