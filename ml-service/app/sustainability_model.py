"""
Sustainability grading pipeline.

Rebuilt around the "Corrected" training notebook's artifacts, which fixes
two things:

1. Portability. XGBoost boosters are loaded straight from their native JSON
   export (`xgb_regressor_0..5.json`, `grade_classifier.json`) via
   `.load_model()`, NOT via joblib/pickle. Pickled XGBoost boosters proved
   fragile across environments in this project's history -- silently wrong
   predictions on one xgboost version, a hard "input stream corrupted"
   crash on another, even with identical model files. JSON is XGBoost's own
   documented cross-version-safe export format, so this sidesteps that
   whole class of bug. Only the sklearn preprocessing objects
   (OneHotEncoder/ColumnTransformer, LabelEncoder -- no XGBoost internals)
   still go through joblib, which is a much smaller compatibility surface
   and hasn't shown this problem.

2. Train/inference consistency. The corrected notebook trains the grade
   classifier on the REGRESSOR's own predictions for the 6 regression-target
   columns, not ground truth -- because the regressor's predictions are the
   only thing ever available at inference time too. This module mirrors
   that exactly: the classifier always sees the regressor's predictions.

Preprocessing uses two SEPARATE fitted ColumnTransformers (one for the
regressor's 8 inputs, one for the classifier's 18 inputs) -- they are not
shared/mutated between stages, matching how they were fit during training.
"""
import joblib
import pandas as pd
from xgboost import XGBRegressor, XGBClassifier

from app import config

_preprocessor = joblib.load(config.SUSTAINABILITY_PREPROCESSOR_PATH)
_classifier_preprocessor = joblib.load(config.SUSTAINABILITY_CLASSIFIER_PREPROCESSOR_PATH)
_grade_encoder = joblib.load(config.GRADE_ENCODER_PATH)

_regressor_estimators = []
for _path in config.SUSTAINABILITY_REGRESSOR_JSON_PATHS:
    _est = XGBRegressor()
    _est.load_model(_path)
    _regressor_estimators.append(_est)

_classifier_model = XGBClassifier()
_classifier_model.load_model(config.SUSTAINABILITY_GRADE_CLASSIFIER_JSON_PATH)

RAW_FEATURES = [
    "fabric_type", "weight_kg", "health_score", "repairability",
    "condition", "district", "province", "industry_type",
]
REGRESSOR_OUTPUT_NAMES = [
    "circularity_score", "recyclability_score",
    "carbon_reduction_percent", "water_reduction_percent",
    "co2_saved_kg", "water_saved_liters",
]
FULL_FEATURES = RAW_FEATURES + [
    "circularity_score", "recyclability_score",
    "carbon_reduction_percent", "water_reduction_percent",
    "co2_saved_kg", "water_saved_liters",
    "energy_saved_kwh", "landfill_diverted_kg",
    "sdg_impact_score", "economic_impact_score",
]


def _clip(value: float, lo: float, hi: float) -> float:
    return float(max(lo, min(hi, value)))


def grade_material(
    fabric_type: str,
    weight_kg: float,
    health_score: float,
    repairability: str,
    condition: str,
    district: str,
    province: str,
    industry_type: str,
) -> dict:
    weight_kg = max(0.1, float(weight_kg))

    base_row = {
        "fabric_type": fabric_type,
        "weight_kg": weight_kg,
        "health_score": float(health_score),
        "repairability": repairability,
        "condition": condition,
        "district": district,
        "province": province,
        "industry_type": industry_type,
    }
    base_df = pd.DataFrame([base_row])[RAW_FEATURES]

    # Stage 1: regressor preprocessing + the 6 individual boosters.
    transformed = _preprocessor.transform(base_df)
    raw_outputs = [float(est.predict(transformed)[0]) for est in _regressor_estimators]
    outputs = dict(zip(REGRESSOR_OUTPUT_NAMES, raw_outputs))

    # Safety clamp -- the fitted pipeline produces well-bounded values on
    # realistic inputs; this guards against extrapolation on pathological
    # inputs (e.g. an absurd weight_kg), it isn't compensating for broken
    # encoding or a serialization bug anymore.
    outputs["circularity_score"] = round(_clip(outputs["circularity_score"], 0, 100), 2)
    outputs["recyclability_score"] = round(_clip(outputs["recyclability_score"], 0, 100), 2)
    outputs["carbon_reduction_percent"] = round(_clip(outputs["carbon_reduction_percent"], 0, 100), 2)
    outputs["water_reduction_percent"] = round(_clip(outputs["water_reduction_percent"], 0, 100), 2)
    outputs["co2_saved_kg"] = round(_clip(outputs["co2_saved_kg"], 0, weight_kg * 5), 2)
    outputs["water_saved_liters"] = round(_clip(outputs["water_saved_liters"], 0, weight_kg * 300), 2)

    # Not regressor outputs (it only has 6) -- engineered from the outputs
    # above and known physical inputs, exactly as the training notebook
    # builds them for the classifier's extra 4 columns.
    energy_saved_kwh = round(_clip(outputs["co2_saved_kg"] * 1.5, 0, weight_kg * 10), 2)
    landfill_diverted_kg = round(weight_kg * 0.95, 2)
    sdg_impact_score = round((outputs["circularity_score"] + outputs["recyclability_score"]) / 2, 2)
    economic_impact_score = round(
        _clip(outputs["recyclability_score"] * 0.6 + outputs["carbon_reduction_percent"] * 0.4, 0, 100), 2
    )

    full_row = dict(base_row)
    full_row.update(outputs)
    full_row["energy_saved_kwh"] = energy_saved_kwh
    full_row["landfill_diverted_kg"] = landfill_diverted_kg
    full_row["sdg_impact_score"] = sdg_impact_score
    full_row["economic_impact_score"] = economic_impact_score

    full_df = pd.DataFrame([full_row])[FULL_FEATURES]

    # Stage 2: classifier preprocessing (separate ColumnTransformer) + booster.
    full_transformed = _classifier_preprocessor.transform(full_df)
    grade_idx = _classifier_model.predict(full_transformed)
    grade = str(_grade_encoder.inverse_transform(grade_idx)[0])

    return {
        "grade": grade,
        "circularityScore": outputs["circularity_score"],
        "recyclabilityScore": outputs["recyclability_score"],
        "carbonReductionPercent": outputs["carbon_reduction_percent"],
        "waterReductionPercent": outputs["water_reduction_percent"],
        "co2SavedKg": outputs["co2_saved_kg"],
        "waterSavedLiters": outputs["water_saved_liters"],
        "energySavedKwh": energy_saved_kwh,
        "landfillDivertedKg": landfill_diverted_kg,
        "sdgImpactScore": sdg_impact_score,
        "economicImpactScore": economic_impact_score,
    }
