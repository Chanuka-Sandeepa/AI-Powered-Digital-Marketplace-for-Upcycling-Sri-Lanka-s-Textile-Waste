import sys
import os

# Ensures Python can locate the models folder cleanly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, jsonify, request
from flask_cors import CORS
from models.best_listing_time_model import BestListingTimeModel
from models.dynamic_pricing_model import DynamicPricingModel
from models.listing_success_model import ListingSuccessModel
from models.marketplace_trend_model import MarketplaceTrendModel
from models.sales_time_model import SalesTimeModel

app = Flask(__name__)
CORS(app)

print("Starting Flask Backend Server...")

# Intialize models
listing_time_model = BestListingTimeModel()
pricing_model = DynamicPricingModel()
listing_success_model = ListingSuccessModel()
trend_model = MarketplaceTrendModel()
sales_time_model = SalesTimeModel()

# Api routes

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "status": "Online",
        "message": "Marketplace AI Backend Service API"
    })

# Best Listing Time Recommendation
@app.route("/predict/best-listing-time", methods=["POST"])
def predict_best_listing_time():
    try:
        data = request.get_json() or {}
        material_type = data.get("material_type", "")
        waste_quantity = data.get("waste_quantity", 0)
        year = data.get("year", 2026)

        if not material_type or not waste_quantity:
            return jsonify({
                "success": False, 
                "error": "Please provide both 'material_type' and 'waste_quantity'."
            }), 400

        results = listing_time_model.predict(material_type, waste_quantity, year)
        
        return jsonify({
            "success": True, 
            "model_accuracy": f"{listing_time_model.accuracy}%",
            "recommendations": results
        }), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# Dynamic Pricing Recommendation
@app.route("/predict/dynamic-price", methods=["POST"])
def predict_dynamic_price():
    try:
        data = request.get_json() or {}
        material_type = data.get("material_type", "")
        waste_quantity = data.get("waste_quantity", 0)
        month = data.get("month", 1)

        if not material_type or not waste_quantity or not month:
            return jsonify({
                "success": False,
                "error": "Please provide 'material_type', 'waste_quantity', and 'month'."
            }), 400

        result = pricing_model.predict(material_type, waste_quantity, month)

        return jsonify({
            "success": True,
            "model_r2": f"{pricing_model.r2}%",
            "pricing_recommendation": result
        }), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# Listing Success Prediction
@app.route("/predict/listing-success", methods=["POST"])
def predict_listing_success():
    try:
        data = request.get_json() or {}
        material_type = data.get("material_type", "")
        month = data.get("month", None)
        waste_quantity = data.get("waste_quantity", 0)

        if not material_type or month is None or not waste_quantity:
            return jsonify({
                "success": False,
                "error": "Please provide 'material_type', 'month', and 'waste_quantity'."
            }), 400

        result = listing_success_model.predict_listing_success(material_type, month, waste_quantity)

        return jsonify({
            "success": True,
            "model_accuracy": f"{listing_success_model.accuracy}%",
            "prediction": result
        }), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# Marketplace Trend Prediction
@app.route("/predict/marketplace-trend", methods=["POST"])
def predict_marketplace_trend():
    try:
        data = request.get_json() or {}
        material_type = data.get("material_type", "")
        month = data.get("month", None)
        waste_quantity = data.get("waste_quantity", 0)

        if not material_type or month is None or not waste_quantity:
            return jsonify({
                "success": False,
                "error": "Please provide 'material_type', 'month', and 'waste_quantity'."
            }), 400

        result = trend_model.predict_marketplace_trend(material_type, month, waste_quantity)

        return jsonify({
            "success": True,
            "model_accuracy": f"{trend_model.accuracy}%",
            "trend_prediction": result
        }), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

    # Sales Time Prediction
@app.route("/predict/sales-time", methods=["POST"])
def predict_sales_time():
    try:
        data = request.get_json() or {}
        material_type = data.get("material_type", "")
        month = data.get("month", None)
        waste_quantity = data.get("waste_quantity", 0)

        if not material_type or month is None or not waste_quantity:
            return jsonify({
                "success": False,
                "error": "Please provide 'material_type', 'month', and 'waste_quantity'."
            }), 400

        result = sales_time_model.predict_sales_time(material_type, month, waste_quantity)

        return jsonify({
            "success": True,
            "model_r2": f"{sales_time_model.r2}%",
            "sales_time_prediction": result
        }), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5003, debug=True)