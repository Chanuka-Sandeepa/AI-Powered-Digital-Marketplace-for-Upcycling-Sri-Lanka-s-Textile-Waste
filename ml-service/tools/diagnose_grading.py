"""
Standalone diagnostic for the sustainability grading pipeline. Run this
directly (no server needed) to see exactly what's happening at each step
on THIS machine, so it can be compared against expected values.

Usage (from the ml-service folder):
    python tools/diagnose_grading.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import joblib
import pandas as pd
import xgboost
import sklearn

print("=" * 70)
print("ENVIRONMENT")
print("=" * 70)
print("Python:    ", sys.version.split()[0])
print("pandas:    ", pd.__version__)
print("xgboost:   ", xgboost.__version__)
print("scikit-learn:", sklearn.__version__)

MODELS_DIR = Path(__file__).resolve().parent.parent / "models"
reg = joblib.load(MODELS_DIR / "sustainability_regressor.pkl")
clf = joblib.load(MODELS_DIR / "sustainability_grade_model.pkl")
enc = joblib.load(MODELS_DIR / "grade_encoder.pkl")

print("\nRegressor type:", type(reg).__name__)
print("Regressor n_estimators (outputs):", len(reg.estimators_))
print("Grade model type:", type(clf).__name__)
print("Grade encoder classes:", list(enc.classes_))

# ---- Exact same category universes as app/sustainability_model.py ----
FABRIC_TYPES = sorted([
    "Acrylic", "Artificial_fur", "Artificial_leather", "Blended", "Blended Fabric",
    "Canvas", "Chenille", "Chiffon", "Corduroy", "Cotton", "Crepe", "Denim", "Felt",
    "Fleece", "Leather", "Linen", "Nylon", "Polyester", "Rayon", "Satin", "Silk",
    "Suede", "Terrycloth", "Velvet", "Viscose", "Wool",
])
REPAIRABILITY = sorted(["Highly Repairable", "Moderately Repairable", "Repairable with Care", "Limited Repairability"])
CONDITIONS = sorted(["Excellent", "Good", "Fair", "Poor"])
DISTRICTS = sorted([
    "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya", "Galle", "Matara",
    "Hambantota", "Jaffna", "Kilinochchi", "Mannar", "Vavuniya", "Mullaitivu", "Batticaloa",
    "Ampara", "Trincomalee", "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa",
    "Badulla", "Monaragala", "Ratnapura", "Kegalle",
])
PROVINCES = sorted(["Western", "Central", "Southern", "Northern", "Eastern", "North Western", "North Central", "Uva", "Sabaragamuwa"])
INDUSTRY_TYPES = sorted(["Apparel Manufacturing", "Textile Mill", "Garment Factory", "Fabric Wholesaler", "Fashion Retailer", "Home Textiles", "Other"])

CAT_UNIVERSE = {
    "fabric_type": FABRIC_TYPES, "repairability": REPAIRABILITY, "condition": CONDITIONS,
    "district": DISTRICTS, "province": PROVINCES, "industry_type": INDUSTRY_TYPES,
}

row = {
    "fabric_type": "Cotton", "weight_kg": 40.0, "health_score": 2.1,
    "repairability": "Limited Repairability", "condition": "Good",
    "district": "Colombo", "province": "Western", "industry_type": "Apparel Manufacturing",
}
BASE_FEATURES = ["fabric_type", "weight_kg", "health_score", "repairability", "condition", "district", "province", "industry_type"]

df = pd.DataFrame([row])[BASE_FEATURES]
for c, cats in CAT_UNIVERSE.items():
    df[c] = df[c].astype(pd.CategoricalDtype(categories=cats, ordered=False))

print("\n" + "=" * 70)
print("CATEGORY CODES ASSIGNED (should NOT all be 0)")
print("=" * 70)
for c in CAT_UNIVERSE:
    print(f"  {c:<15} value={row[c]!r:<28} code={df[c].cat.codes.tolist()[0]}  (universe size={len(CAT_UNIVERSE[c])})")

print("\n" + "=" * 70)
print("DATAFRAME DTYPES")
print("=" * 70)
print(df.dtypes)

print("\n" + "=" * 70)
print("RAW REGRESSOR OUTPUT (before any clipping)")
print("=" * 70)
raw = reg.predict(df)[0]
names = ["circularity_score", "recyclability_score", "carbon_reduction_percent",
         "water_reduction_percent", "co2_saved_kg", "water_saved_liters"]
for n, v in zip(names, raw):
    print(f"  {n:<28} {v}")

print("\nIf every value above is negative or exactly 0, the regressor itself")
print("is producing degenerate output on this machine even with correct")
print("category codes - that's a genuine environment difference (likely an")
print("XGBoost version difference in how it reads categorical splits from a")
print("pickled model), not a caching/file problem. Send this whole output.")
