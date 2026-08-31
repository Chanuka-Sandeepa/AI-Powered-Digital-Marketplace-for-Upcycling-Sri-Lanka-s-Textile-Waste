"""
Marketplace intelligence pipeline...

The project historically serialized XGBoost-backed pickles in a way that is
not portable across environments; several artifacts can fail to deserialize
with "input stream corrupted" even when the file itself is valid. This module
now treats those model-load failures as a recoverable runtime condition: it
keeps the app available and falls back to transparent heuristics instead of
crashing the entire price-prediction pipeline.
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


_price_model = _safe_load(config.PRICE_PREDICTION_MODEL_PATH, "price")
_demand_model = _safe_load(config.DEMAND_PREDICTION_MODEL_PATH, "demand")
_demand_encoder = _safe_load(config.DEMAND_LABEL_ENCODER_PATH, "demand_encoder")
_buyer_rf = _safe_load(config.BUYER_RECOMMENDATION_RF_PATH, "buyer_rf")
_buyer_xgb = _safe_load(config.BUYER_RECOMMENDATION_XGB_PATH, "buyer_xgb")
_buyer_encoder = _safe_load(config.BUYER_LABEL_ENCODER_PATH, "buyer_encoder")

_MODELS_AVAILABLE = all(item is not None for item in (
    _price_model,
    _demand_model,
    _demand_encoder,
    _buyer_rf,
    _buyer_xgb,
    _buyer_encoder,
))

PRICE_FEATURES = [
    "health_score", "defect_area", "remaining_lifespan", "sustainability_score",
    "green_score", "co2_saving", "water_saving", "weight_kg",
    "fabric_type", "repairability", "district", "industry_type", "condition",
]
DEMAND_FEATURES = PRICE_FEATURES + ["price_per_kg"]
BUYER_FEATURES = DEMAND_FEATURES + ["demand_level"]

def _fallback_price(features: dict) -> float:
    health = float(features.get("health_score", 50.0) or 50.0)
    sustainability = float(features.get("sustainability_score", 50.0) or 50.0)
    green = float(features.get("green_score", 50.0) or 50.0)
    weight = float(features.get("weight_kg", 1.0) or 1.0)
    defect_area = float(features.get("defect_area", 0.0) or 0.0)
    remaining = float(features.get("remaining_lifespan", 0.0) or 0.0)
    repairability = str(features.get("repairability", "Repairable with Care") or "Repairable with Care")
    condition = str(features.get("condition", "Good") or "Good")

    quality_bonus = 0.0
    if repairability.lower().startswith("high"):
        quality_bonus += 25
    elif repairability.lower().startswith("moder"):
        quality_bonus += 12
    elif repairability.lower().startswith("limited"):
        quality_bonus -= 15

    if condition.lower() == "excellent":
        quality_bonus += 18
    elif condition.lower() == "good":
        quality_bonus += 8
    elif condition.lower() == "fair":
        quality_bonus -= 5
    elif condition.lower() == "poor":
        quality_bonus -= 15

    base = 18 + (health / 100.0) * 65 + (sustainability / 100.0) * 35 + (green / 100.0) * 25
    base += quality_bonus
    base -= defect_area * 0.5
    base += min(remaining, 24) * 0.9
    base *= max(0.45, min(1.8, weight / 10.0))
    return round(max(5.0, base), 2)


def predict_price(features: dict) -> float:
    if not _MODELS_AVAILABLE:
        logger.warning("[predict_price] Marketplace price models unavailable; using fallback estimate.")
        return _fallback_price(features)

    df = pd.DataFrame([features])[
        [c for c in PRICE_FEATURES if c not in ("price_per_kg", "demand_level")]
    ]
    raw_price = float(_price_model.predict(df)[0])

    if raw_price <= 0:
        fallback = _fallback_price(features)
        logger.warning(
            "[predict_price] Model predicted a non-positive raw price: %.2f. Using fallback estimate %.2f instead of clamping to 0.",
            raw_price,
            fallback,
        )
        return fallback

    return round(raw_price, 2)


def predict_demand(features: dict) -> dict:
    if not _MODELS_AVAILABLE:
        price = float(features.get("price_per_kg", 0.0) or 0.0)
        sustainability_score = float(features.get("sustainability_score", 50.0) or 50.0)
        health_score = float(features.get("health_score", 50.0) or 50.0)
        score = (sustainability_score * 0.6) + (health_score * 0.4)
        if score >= 75 or price >= 120:
            level = "High"
        elif score >= 50 or price >= 80:
            level = "Medium"
        else:
            level = "Low"
        return {"level": level, "confidence": 68.0, "distribution": {"Low": 18.0, "Medium": 52.0, "High": 30.0}, "levelIndex": 1 if level == "Medium" else 2 if level == "High" else 0}

    df = pd.DataFrame([features])[DEMAND_FEATURES]
    class_idx = int(_demand_model.predict(df)[0])
    proba = _demand_model.predict_proba(df)[0]
    level = str(_demand_encoder.inverse_transform([class_idx])[0])
    distribution = {
        str(label): round(float(p) * 100, 2)
        for label, p in zip(_demand_encoder.classes_, proba)
    }
    confidence = round(float(max(proba)) * 100, 2)
    return {"level": level, "confidence": confidence, "distribution": distribution, "levelIndex": class_idx}


def demand_label_to_index(label: str) -> int:
    """Exposes the demand model's own fitted label encoding, so downstream
    models (trend_model.py) that expect demand_level as a number use the
    real fitted mapping instead of a separately-guessed one."""
    if _demand_encoder is None:
        label_name = str(label or "Medium").lower()
        if label_name == "high":
            return 2
        if label_name == "medium":
            return 1
        return 0
    return int(_demand_encoder.transform([label])[0])


def recommend_buyers(features: dict, top_n: int = 5) -> list:
    if not _MODELS_AVAILABLE:
        demand = features.get("demand_level", "Medium")
        demand_name = str(demand)
        if demand_name.lower() == "high":
            buyer_types = ["Textile Recyclers", "Apparel Manufacturers", "Exporter Buyers", "Upcyclers", "Local Factories"]
        elif demand_name.lower() == "low":
            buyer_types = ["Local Traders", "Waste Aggregators", "Upcyclers", "Apparel Manufacturers", "Exporter Buyers"]
        else:
            buyer_types = ["Apparel Manufacturers", "Textile Recyclers", "Local Traders", "Upcyclers", "Exporter Buyers"]
        return [{"buyerType": name, "matchScore": round(100 - idx * 12, 2)} for idx, name in enumerate(buyer_types[:top_n])]

    df = pd.DataFrame([features])[BUYER_FEATURES]

    rf_proba = _buyer_rf.predict_proba(df)[0]
    rf_classes = list(_buyer_rf.named_steps["classifier"].classes_)

    xgb_proba = _buyer_xgb.predict_proba(df)[0]
    xgb_classes = list(_buyer_encoder.classes_)

    # Blend both models' probabilities per buyer type (averaged), even
    # though both were fit on the same class set in the same order in
    # practice -- look each label up explicitly rather than assuming
    # identical ordering, so this stays correct even if that changes.
    all_buyer_types = sorted(set(rf_classes) | set(xgb_classes))
    blended = {}
    for buyer_type in all_buyer_types:
        rf_score = float(rf_proba[rf_classes.index(buyer_type)]) if buyer_type in rf_classes else 0.0
        xgb_score = float(xgb_proba[xgb_classes.index(buyer_type)]) if buyer_type in xgb_classes else 0.0
        blended[buyer_type] = (rf_score + xgb_score) / 2

    ranked = sorted(blended.items(), key=lambda kv: kv[1], reverse=True)[:top_n]
    return [{"buyerType": name, "matchScore": round(score * 100, 2)} for name, score in ranked]


def analyze_marketplace(base_features: dict) -> dict:
    """Runs the full price -> demand -> buyer cascade for one material."""
    predicted_price = predict_price(base_features)

    demand_input = dict(base_features)
    demand_input["price_per_kg"] = predicted_price
    demand = predict_demand(demand_input)

    buyer_input = dict(demand_input)
    buyer_input["demand_level"] = demand["level"]
    recommended_buyers = recommend_buyers(buyer_input)

    return {
        "predictedPricePerKg": predicted_price,
        "demandLevel": demand["level"],
        "demandLevelIndex": demand["levelIndex"],
        "demandConfidence": demand["confidence"],
        "demandDistribution": demand["distribution"],
        "recommendedBuyers": recommended_buyers,
    }
