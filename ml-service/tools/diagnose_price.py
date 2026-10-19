"""
Tests the price prediction model directly with the exact scenario that's
producing LKR 0 in the app (a 400kg Denim listing), and prints environment
info so it can be compared against a known-good run.

Usage (from the ml-service folder):
    python tools/diagnose_price.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pandas as pd
import xgboost
import sklearn

print("=" * 70)
print("ENVIRONMENT")
print("=" * 70)
print("xgboost:     ", xgboost.__version__)
print("scikit-learn:", sklearn.__version__)
print("(expected: xgboost 3.3.0, scikit-learn 1.6.1 - if these don't match,")
print(" that is very likely the bug)")

from app import config
from app.marketplace_model import _price_model, PRICE_FEATURES

print("\n" + "=" * 70)
print("TEST SCENARIOS (compare these numbers against the assistant's results)")
print("=" * 70)

scenarios = [
    {"label": "Baseline (small, healthy)",
     "row": {"health_score": 92, "defect_area": 0, "remaining_lifespan": 22, "sustainability_score": 85,
             "green_score": 78, "co2_saving": 45, "water_saving": 900, "weight_kg": 40,
             "fabric_type": "Cotton", "repairability": "Highly Repairable",
             "district": "Colombo", "industry_type": "Apparel Manufacturing", "condition": "Good"}},
    {"label": "Real scenario: 400kg Denim",
     "row": {"health_score": 92, "defect_area": 0, "remaining_lifespan": 22, "sustainability_score": 85,
             "green_score": 78, "co2_saving": 45, "water_saving": 900, "weight_kg": 400,
             "fabric_type": "Denim", "repairability": "Highly Repairable",
             "district": "Colombo", "industry_type": "Apparel Manufacturing", "condition": "Good"}},
    {"label": "Everything zeroed out (worst case)",
     "row": {"health_score": 0, "defect_area": 100, "remaining_lifespan": 0, "sustainability_score": 0,
             "green_score": 0, "co2_saving": 0, "water_saving": 0, "weight_kg": 400,
             "fabric_type": "Denim", "repairability": "Limited Repairability",
             "district": "Colombo", "industry_type": "Apparel Manufacturing", "condition": "Poor"}},
]

for s in scenarios:
    df = pd.DataFrame([s["row"]])[PRICE_FEATURES]
    raw = float(_price_model.predict(df)[0])
    print(f"\n{s['label']}:")
    print(f"  input: {s['row']}")
    print(f"  RAW predicted price: {raw:.4f}")

print("\n" + "=" * 70)
print("Expected (from the assistant's environment, xgboost 3.3.0):")
print("  Baseline (small, healthy)     -> ~311.63")
print("  Real scenario: 400kg Denim    -> ~323.49")
print("  Everything zeroed out         -> still a real positive number, NOT 0")
print("If your numbers are drastically different (especially 0 or negative),")
print("send this entire output back - the xgboost/scikit-learn version line")
print("at the top is the single most important piece of information.")
