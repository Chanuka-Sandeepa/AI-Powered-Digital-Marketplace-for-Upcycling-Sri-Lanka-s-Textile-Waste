import os
import json

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")

# ---- Fabric classification model ----
FABRIC_CLASSIFIER_PATH = os.path.join(MODELS_DIR, "fabric_classifier.pth")
FABRIC_CLASSES_PATH = os.path.join(MODELS_DIR, "fabric_classes.json")

# ---- Defect detection model ----
# Replaces the earlier ResNet34 U-Net pixel-segmentation approach - the
# actual checkpoint here is a whole-image binary classifier (MobileNetV2 +
# custom 2-class head), not a segmentation model, despite the filename
# below still being "defect_unet.pth" for historical reasons. See
# app/defect_model.py for details.
DEFECT_CLASSIFIER_PATH = os.path.join(MODELS_DIR, "defect_unet.pth")
DEFECT_CLASSES_PATH = os.path.join(MODELS_DIR, "defect_classes.json")

with open(DEFECT_CLASSES_PATH, "r") as f:
    DEFECT_CLASSES = json.load(f)["classes"]

# ---- Sustainability pipeline ----
# Each XGBoost booster is loaded from its own portable JSON export (not
# joblib/pickle) -- see the top of app/sustainability_model.py for why.
# Only the sklearn preprocessing objects go through joblib.
SUSTAINABILITY_PREPROCESSOR_PATH = os.path.join(MODELS_DIR, "preprocessor.pkl")
SUSTAINABILITY_CLASSIFIER_PREPROCESSOR_PATH = os.path.join(MODELS_DIR, "classifier_preprocessor.pkl")
SUSTAINABILITY_REGRESSOR_JSON_PATHS = [
    os.path.join(MODELS_DIR, f"xgb_regressor_{i}.json") for i in range(6)
]
SUSTAINABILITY_GRADE_CLASSIFIER_JSON_PATH = os.path.join(MODELS_DIR, "grade_classifier.json")
GRADE_ENCODER_PATH = os.path.join(MODELS_DIR, "grade_encoder.pkl")

# ---- Marketplace intelligence (price / demand / buyer recommendation) ----
PRICE_PREDICTION_MODEL_PATH = os.path.join(MODELS_DIR, "price_prediction_model.pkl")
DEMAND_PREDICTION_MODEL_PATH = os.path.join(MODELS_DIR, "demand_prediction_model.pkl")
DEMAND_LABEL_ENCODER_PATH = os.path.join(MODELS_DIR, "demand_label_encoder.pkl")
BUYER_RECOMMENDATION_RF_PATH = os.path.join(MODELS_DIR, "buyer_recommendation_rf.pkl")
BUYER_RECOMMENDATION_XGB_PATH = os.path.join(MODELS_DIR, "buyer_recommendation_xgb.pkl")
BUYER_LABEL_ENCODER_PATH = os.path.join(MODELS_DIR, "buyer_label_encoder.pkl")

# ---- Marketplace trend / listing success / sales-time prediction ----
MARKETPLACE_TREND_MODEL_PATH = os.path.join(MODELS_DIR, "marketplace_trend_model.pkl")
MARKETPLACE_TREND_ENCODER_PATH = os.path.join(MODELS_DIR, "marketplace_trend_label_encoder.pkl")
LISTING_SUCCESS_MODEL_PATH = os.path.join(MODELS_DIR, "listing_success_model.pkl")
LISTING_SUCCESS_ENCODER_PATH = os.path.join(MODELS_DIR, "listing_success_encoder.pkl")
SALES_TIME_MODEL_PATH = os.path.join(MODELS_DIR, "sales_time_prediction_model.pkl")

# ---- Fabric classes ----
with open(FABRIC_CLASSES_PATH, "r") as f:
    FABRIC_CLASSES = json.load(f)["classes"]

NUM_FABRIC_CLASSES = len(FABRIC_CLASSES)

# ---- Image settings ----
CLASSIFIER_IMG_SIZE = int(os.environ.get("CLASSIFIER_IMG_SIZE", 224))
DEFECT_IMG_SIZE = int(os.environ.get("DEFECT_IMG_SIZE", 224))

# Below this raw confidence, a "Defect" prediction is treated as the model
# being uncertain rather than actually detecting something -- benefit of
# the doubt. Evidence-based: 4 real, confirmed-clean fabric photos (a
# denim swatch + 3 knit close-ups) topped out at 53.6% raw p(Defect); this
# threshold (with margin) maps all of them to 0% defect_area, while still
# leaving room above it for genuinely confident detections to register.
DEFECT_CONFIDENCE_THRESHOLD = float(os.environ.get("DEFECT_CONFIDENCE_THRESHOLD", 0.70))
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

# ---- Server ----
PORT = int(os.environ.get("ML_SERVICE_PORT", 8001))
