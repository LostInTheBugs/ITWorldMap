"""Merge all data sources into a single country-level JSON for the frontend."""
import json
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent
PROCESSED_DIR = DATA_DIR / "processed"
SRC_DATA_DIR = DATA_DIR.parent / "src" / "data"


def load_json(path: Path) -> dict:
    if not path.exists():
        print(f"WARNING: {path} not found, skipping")
        return {}
    with open(path) as f:
        data = json.load(f)
    if isinstance(data, list):
        return {entry["iso3"]: entry for entry in data}
    return data


def main():
    wb = load_json(PROCESSED_DIR / "worldbank.json")
    ipv6 = load_json(PROCESSED_DIR / "ipv6.json")

    all_codes = set(wb.keys()) | set(ipv6.keys())

    merged = []
    for iso3 in sorted(all_codes):
        entry = {"iso3": iso3}
        if iso3 in wb:
            entry.update({k: v for k, v in wb[iso3].items() if k != "iso3"})
        if iso3 in ipv6:
            entry.update({k: v for k, v in ipv6[iso3].items() if k != "iso3"})
        merged.append(entry)

    SRC_DATA_DIR.mkdir(parents=True, exist_ok=True)
    out_path = SRC_DATA_DIR / "indicators.json"
    with open(out_path, "w") as f:
        json.dump(merged, f, indent=2)

    print(f"Merged {len(merged)} countries → {out_path}")


if __name__ == "__main__":
    main()
