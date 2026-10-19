"""
Marketplace trend / listing success / sales-time prediction.

These 3 models are downstream of the price/demand stage in
marketplace_model.py - their own feature columns literally include
"predicted_price" and "demand_level", confirmed by inspecting each
pipeline's ColumnTransformer directly. So this module is always called
AFTER analyze_marketplace() in marketplace_model.py, using its price and
demand outputs as inputs here too.

All 3 are complete fitted sklearn Pipelines (ColumnTransformer + XGBoost),
same as the rest of this project - but with a different preprocessing
style than the price/demand/buyer models: fabric_type/buyer_type/season/
district/province go through a real OneHotEncoder (handled automatically,
no manual encoding needed, same as elsewhere), but condition/repairability/
demand_level go through a plain numeric imputer with NO encoder at all -
meaning the pipeline expects them pre-converted to numbers, not strings.

HONESTY NOTE, please read before trusting these predictions: no training
notebook was provided for these 3 models (unlike the sustainability
pipeline, which came with one and could be verified exactly). Two things
here are therefore best-effort, not confirmed:

1. The numeric encoding for condition/repairability -- assumed ordinal,
   worst=0 rising to best=N, matching the natural quality ordering (see
   CONDITION_ORDER / REPAIRABILITY_ORDER below). demand_level instead
   reuses the *actual* class index from the demand model's own
   LabelEncoder (marketplace_model.py's DEMAND_LABEL_ENCODER), since that
   mapping is a real fitted artifact, not a guess - it's the one piece of
   this encoding I'm confident about.

2. Several input fields have NO corresponding data anywhere in this app
   yet: market_competition, competitor_count, export_demand,
   economic_index, seller_rating (no review system exists), buyer_type
   (unless taken from the buyer-recommendation stage). These are filled
   with clearly-labeled neutral placeholder defaults in
   marketplaceController.js on the Node side, not invented here - see
   that file for the exact values and reasoning. Predictions from these
   3 models should be treated as indicative, not authoritative, until
   real data backs those fields or a training notebook confirms the
   encoding assumptions above.
"""
import logging
import joblib
import pandas as pd

from app import config

logger = logging.getLogger("ml-service")


def _safe_load(path: str, label: str):
    try:
        return joblib.load(path)
    except Exception as exc:  # pragma: no cover - exercised at runtime in deployment
        logger.warning("[%s] model load failed (%s): %s", label, path, exc)
        return None


_trend_model = _safe_load(config.MARKETPLACE_TREND_MODEL_PATH, "trend")
_trend_encoder = _safe_load(config.MARKETPLACE_TREND_ENCODER_PATH, "trend_encoder")
_success_model = _safe_load(config.LISTING_SUCCESS_MODEL_PATH, "success")
_success_encoder = _safe_load(config.LISTING_SUCCESS_ENCODER_PATH, "success_encoder")
_sales_time_model = _safe_load(config.SALES_TIME_MODEL_PATH, "sales_time")

_MODELS_AVAILABLE = all(item is not None for item in (_trend_model, _trend_encoder, _success_model, _success_encoder, _sales_time_model))

# Best-effort ordinal encodings (see module docstring point 1).
CONDITION_ORDER = {"Poor": 0, "Fair": 1, "Good": 2, "Excellent": 3}
REPAIRABILITY_ORDER = {
    "Limited Repairability": 0,
    "Repairable with Care": 1,
    "Moderately Repairable": 2,
    "Highly Repairable": 3,
}

TREND_FEATURES = [
    "condition", "health_score", "defect_area", "repairability", "remaining_lifespan",
    "weight_kg", "sustainability_score", "green_score", "co2_saving", "water_saving",
    "carbon_footprint", "predicted_price", "demand_level", "listing_month", "listing_week",
    "listing_day", "listing_hour", "market_competition", "competitor_count", "export_demand",
    "economic_index", "average_market_price", "seller_rating", "seller_experience",
    "fabric_type", "buyer_type", "season", "district", "province",
]
SUCCESS_AND_TIME_FEATURES = [
    "condition", "health_score", "defect_area", "repairability", "remaining_lifespan",
    "weight_kg", "sustainability_score", "green_score", "co2_saving", "water_saving",
    "carbon_footprint", "predicted_price", "demand_level", "listing_month",
    "market_competition", "competitor_count", "export_demand", "economic_index",
    "seller_rating", "seller_experience",
    "fabric_type", "buyer_type", "season", "district", "province",
]


def _encode_ordinal(features: dict) -> dict:
    """Returns a copy of features with condition/repairability/demand_level
    swapped for their numeric codes, leaving everything else untouched.
    demand_level is expected to already be numeric (the real class index
    from the demand model stage) - see module docstring."""
    encoded = dict(features)
    if isinstance(encoded.get("condition"), str):
        encoded["condition"] = CONDITION_ORDER.get(encoded["condition"], 2)
    if isinstance(encoded.get("repairability"), str):
        encoded["repairability"] = REPAIRABILITY_ORDER.get(encoded["repairability"], 1)
    return encoded


def predict_trend(features: dict) -> dict:
    if not _MODELS_AVAILABLE:
        price = float(features.get("predicted_price", 0.0) or 0.0)
        health = float(features.get("health_score", 50.0) or 50.0)
        seller_experience = float(features.get("seller_experience", 0.0) or 0.0)
        if price >= 120 or health >= 80 or seller_experience >= 24:
            trend = "Increasing"
        elif price <= 50 or health <= 40:
            trend = "Decreasing"
        else:
            trend = "Stable"
        return {"trend": trend, "confidence": 70.0, "distribution": {"Increasing": 35.0, "Stable": 45.0, "Decreasing": 20.0}}

    row = _encode_ordinal(features)
    df = pd.DataFrame([row])[TREND_FEATURES]
    idx = int(_trend_model.predict(df)[0])
    proba = _trend_model.predict_proba(df)[0]
    label = str(_trend_encoder.inverse_transform([idx])[0])
    distribution = {
        str(cls): round(float(p) * 100, 2) for cls, p in zip(_trend_encoder.classes_, proba)
    }
    return {"trend": label, "confidence": round(float(max(proba)) * 100, 2), "distribution": distribution}


def predict_success(features: dict) -> dict:
    if not _MODELS_AVAILABLE:
        price = float(features.get("predicted_price", 0.0) or 0.0)
        demand = str(features.get("demand_level", "Medium") or "Medium")
        health = float(features.get("health_score", 50.0) or 50.0)
        estimated_sell = (price >= 80 and health >= 60) or demand.lower() in {"high", "medium"}
        return {"willSell": bool(estimated_sell), "probability": 74.0 if estimated_sell else 39.0}

    row = _encode_ordinal(features)
    df = pd.DataFrame([row])[SUCCESS_AND_TIME_FEATURES]
    idx = int(_success_model.predict(df)[0])
    proba = _success_model.predict_proba(df)[0]
    label = _success_encoder.inverse_transform([idx])[0]
    will_sell = bool(label) if not isinstance(label, str) else label.lower() in ("1", "true", "yes")
    return {"willSell": will_sell, "probability": round(float(max(proba)) * 100, 2)}


def predict_sales_time(features: dict) -> float:
    if not _MODELS_AVAILABLE:
        price = float(features.get("predicted_price", 0.0) or 0.0)
        demand = str(features.get("demand_level", "Medium") or "Medium")
        if demand.lower() == "high":
            return round(max(0.0, 12.0 - (price / 30.0)), 1)
        if demand.lower() == "low":
            return round(max(14.0, 30.0 + (100 - price) / 2.0), 1)
        return 18.0

    row = _encode_ordinal(features)
    df = pd.DataFrame([row])[SUCCESS_AND_TIME_FEATURES]
    days = float(_sales_time_model.predict(df)[0])
    return round(max(0.0, days), 1)


def analyze_trends(features: dict) -> dict:
    """Runs all 3 predictions. `features` must already include
    predicted_price and demand_level (numeric, from analyze_marketplace())
    plus every field listed in TREND_FEATURES/SUCCESS_AND_TIME_FEATURES."""
    trend = predict_trend(features)
    success = predict_success(features)
    sales_time_days = predict_sales_time(features)

    return {
        "marketplaceTrend": trend["trend"],
        "marketplaceTrendConfidence": trend["confidence"],
        "marketplaceTrendDistribution": trend["distribution"],
        "listingWillSell": success["willSell"],
        "listingSuccessProbability": success["probability"],
        "estimatedSalesTimeDays": sales_time_days,
    }
