import logging
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app import config
from app.schemas import (
    FabricAnalysisResult, SustainabilityRequest, SustainabilityResult,
    MarketplaceRequest, MarketplaceResult,
)
from app import fabric_model, defect_model, sustainability_model, marketplace_model, trend_model

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ml-service")

app = FastAPI(
    title="TexCycle AI - ML Inference Service",
    description="Fabric type classification, defect detection and sustainability grading for the TexCycle AI marketplace.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "models": {
            "fabricClassifier": "loaded",
            "defectClassifier": "loaded",
            "sustainabilityRegressor": "loaded",
            "sustainabilityGradeModel": "loaded",
            "gradeEncoder": "loaded",
            "priceModel": "loaded",
            "demandModel": "loaded",
            "buyerRecommendationRf": "loaded",
            "buyerRecommendationXgb": "loaded",
            "marketplaceTrendModel": "loaded",
            "listingSuccessModel": "loaded",
            "salesTimeModel": "loaded",
        },
        "fabricClasses": config.FABRIC_CLASSES,
        "defectClasses": config.DEFECT_CLASSES,
    }


@app.post("/analyze", response_model=FabricAnalysisResult)
async def analyze(file: UploadFile = File(...)):
    """Run fabric-type classification + defect segmentation on a single image."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image")

    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty file upload")

    try:
        classification = fabric_model.classify_fabric(image_bytes)
        defects = defect_model.analyze_defects(image_bytes, fabric_type=classification["fabricType"])
    except Exception as exc:  # noqa: BLE001
        logger.exception("Inference failed")
        raise HTTPException(status_code=500, detail=f"Inference failed: {exc}") from exc

    return FabricAnalysisResult(
        fabricType=classification["fabricType"],
        classIndex=classification["classIndex"],
        confidence=classification["confidence"],
        defectArea=defects["defectArea"],
        healthScore=defects["healthScore"],
        repairability=defects["repairability"],
        remainingLifespan=defects["remainingLifespan"],
        distribution=classification["distribution"],
    )


@app.post("/grade", response_model=SustainabilityResult)
def grade(payload: SustainabilityRequest):
    """Run the sustainability grading pipeline for a material batch."""
    try:
        result = sustainability_model.grade_material(
            fabric_type=payload.fabricType,
            weight_kg=payload.weightKg,
            health_score=payload.healthScore,
            repairability=payload.repairability,
            condition=payload.condition,
            district=payload.district,
            province=payload.province,
            industry_type=payload.industryType,
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("Grading failed")
        raise HTTPException(status_code=500, detail=f"Grading failed: {exc}") from exc

    return SustainabilityResult(**result)


@app.post("/marketplace/analyze", response_model=MarketplaceResult)
def marketplace_analyze(payload: MarketplaceRequest):
    """Runs price -> demand -> buyer-recommendation, then trend/listing-success/
    sales-time (which need price and demand as their own inputs - see
    trend_model.py's module docstring for exactly which fields are real vs.
    honest placeholder defaults)."""
    logger.info(f"[marketplace/analyze] received payload: {payload.model_dump()}")
    try:
        base_features = {
            "health_score": payload.healthScore,
            "defect_area": payload.defectArea,
            "remaining_lifespan": payload.remainingLifespan,
            "sustainability_score": payload.sustainabilityScore,
            "green_score": payload.greenScore,
            "co2_saving": payload.co2Saving,
            "water_saving": payload.waterSaving,
            "weight_kg": payload.weightKg,
            "fabric_type": payload.fabricType,
            "repairability": payload.repairability,
            "district": payload.district,
            "industry_type": payload.industryType,
            "condition": payload.condition,
        }
        logger.info(f"[marketplace/analyze] features passed to price/demand/buyer models: {base_features}")
        stage1 = marketplace_model.analyze_marketplace(base_features)
        logger.info(f"[marketplace/analyze] price/demand/buyer result: {stage1}")

        trend_features = {
            "condition": payload.condition,
            "health_score": payload.healthScore,
            "defect_area": payload.defectArea,
            "repairability": payload.repairability,
            "remaining_lifespan": payload.remainingLifespan,
            "weight_kg": payload.weightKg,
            "sustainability_score": payload.sustainabilityScore,
            "green_score": payload.greenScore,
            "co2_saving": payload.co2Saving,
            "water_saving": payload.waterSaving,
            "carbon_footprint": payload.carbonFootprint,
            "predicted_price": stage1["predictedPricePerKg"],
            "demand_level": stage1["demandLevelIndex"],
            "listing_month": payload.listingMonth,
            "listing_week": payload.listingWeek,
            "listing_day": payload.listingDay,
            "listing_hour": payload.listingHour,
            "market_competition": payload.marketCompetition,
            "competitor_count": payload.competitorCount,
            "export_demand": payload.exportDemand,
            "economic_index": payload.economicIndex,
            "average_market_price": payload.averageMarketPrice,
            "seller_rating": payload.sellerRating,
            "seller_experience": payload.sellerExperienceMonths,
            "fabric_type": payload.fabricType,
            # Real, computed value from this same request - the buyer type
            # the buyer-recommendation stage actually ranked #1 - rather
            # than a placeholder guess.
            "buyer_type": stage1["recommendedBuyers"][0]["buyerType"] if stage1.get("recommendedBuyers") else payload.buyerType,
            "season": payload.season,
            "district": payload.district,
            "province": payload.province,
        }
        logger.info(f"[marketplace/analyze] features passed to trend/success/sales-time models: {trend_features}")
        stage2 = trend_model.analyze_trends(trend_features)
        logger.info(f"[marketplace/analyze] trend/success/sales-time result: {stage2}")

        result = {**stage1, **stage2}
        del result["demandLevelIndex"]  # internal-only, not part of the public response schema
    except Exception as exc:  # noqa: BLE001
        logger.exception("Marketplace analysis failed")
        raise HTTPException(status_code=500, detail=f"Marketplace analysis failed: {exc}") from exc

    return MarketplaceResult(**result)



if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=config.PORT, reload=False)
