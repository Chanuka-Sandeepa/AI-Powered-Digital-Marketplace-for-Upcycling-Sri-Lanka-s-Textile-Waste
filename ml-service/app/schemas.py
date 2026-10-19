from pydantic import BaseModel
from typing import Optional, Dict


class FabricAnalysisResult(BaseModel):
    fabricType: str
    classIndex: int
    confidence: float
    defectArea: float
    healthScore: float
    repairability: str
    remainingLifespan: float
    distribution: Optional[Dict[str, float]] = None


class SustainabilityRequest(BaseModel):
    fabricType: str
    weightKg: float
    healthScore: float
    repairability: str
    condition: str = "Good"
    district: str = "Colombo"
    province: str = "Western"
    industryType: str = "Apparel Manufacturing"


class SustainabilityResult(BaseModel):
    grade: str
    circularityScore: float
    recyclabilityScore: float
    carbonReductionPercent: float
    waterReductionPercent: float
    co2SavedKg: float
    waterSavedLiters: float
    energySavedKwh: float
    landfillDivertedKg: float
    sdgImpactScore: float
    economicImpactScore: float


class MarketplaceRequest(BaseModel):
    fabricType: str
    weightKg: float
    healthScore: float
    defectArea: float
    remainingLifespan: float
    repairability: str
    condition: str = "Good"
    district: str = "Colombo"
    province: str = "Western"
    industryType: str = "Apparel Manufacturing"
    sustainabilityScore: float
    greenScore: float
    co2Saving: float = 0.0
    waterSaving: float = 0.0

    # ---- Fields only used by the trend/listing-success/sales-time models ----
    # See app/trend_model.py's module docstring for exactly which of these
    # are real/derived vs. honest placeholder defaults - this schema just
    # accepts whatever the backend computed, with safety-net defaults here
    # too in case a field is omitted.
    carbonFootprint: float = 0.0
    listingMonth: int = 1
    listingWeek: int = 1
    listingDay: int = 1
    listingHour: int = 12
    marketCompetition: float = 50.0
    competitorCount: int = 10
    exportDemand: float = 50.0
    economicIndex: float = 100.0
    averageMarketPrice: float = 0.0
    sellerRating: float = 3.5
    sellerExperienceMonths: float = 1.0
    buyerType: str = "Recycler"
    season: str = "Summer"


class BuyerRecommendation(BaseModel):
    buyerType: str
    matchScore: float


class MarketplaceResult(BaseModel):
    predictedPricePerKg: float
    demandLevel: str
    demandConfidence: float
    demandDistribution: Dict[str, float]
    recommendedBuyers: list[BuyerRecommendation]
    marketplaceTrend: str
    marketplaceTrendConfidence: float
    marketplaceTrendDistribution: Dict[str, float]
    listingWillSell: bool
    listingSuccessProbability: float
    estimatedSalesTimeDays: float
