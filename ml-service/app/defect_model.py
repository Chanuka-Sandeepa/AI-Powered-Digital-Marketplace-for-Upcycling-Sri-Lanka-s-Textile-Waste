"""
Fabric defect detector.

ARCHITECTURE CHANGE from earlier versions of this file: this replaces the
previous ResNet34 U-Net pixel-segmentation approach entirely. The actual
checkpoint provided for this purpose (fabric_defect_model.pth) is not a
segmentation model at all -- it's a whole-image binary classifier:
torchvision's `mobilenet_v2()` with a custom 2-class head. Confirmed by
strict state_dict loading (0 missing / 0 unexpected keys) into
`mobilenet_v2()` + `Dropout(0.2) -> Linear(1280,128) -> ReLU ->
Dropout(0.2) -> Linear(128,2)`.

This means there's no per-pixel mask and therefore no true "% of fabric
area affected" anymore -- just one confidence score for the whole image.
defectArea/healthScore below are derived from that single score so the
rest of the app (which expects exactly these field names, unchanged since
the U-Net version) keeps working without any other code changes.

Class order is not stored in the checkpoint (a .pth file has no concept
of which output index means what -- same limitation as the fabric
classifier, see fabric_classes.json). The order used here (index 0 =
"Defect", index 1 = "No Defect") is an inferred best guess, backed by two
independent signals: (a) running a confirmed-clean fabric photo through
the model scored higher on index 1, and (b) it matches the alphabetical
class order torchvision's ImageFolder assigns during training ("Defect"
sorts before "No Defect"). It is editable in models/defect_classes.json
if real-world results ever look backwards.
"""
import io
import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import models, transforms
from PIL import Image

from app import config

_device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

DEFECT_CLASSES = config.DEFECT_CLASSES
if len(DEFECT_CLASSES) != 2:
    print(
        f"[defect_model] WARNING: defect_classes.json has {len(DEFECT_CLASSES)} "
        f"entries, but this model's classifier head is fixed at 2 outputs. "
        f"Using generic placeholder labels so startup doesn't crash. Fix "
        f"models/defect_classes.json to have exactly 2 entries."
    )
    DEFECT_CLASSES = ["Defect", "No Defect"]

_model = models.mobilenet_v2(weights=None)
_model.classifier = nn.Sequential(
    nn.Dropout(0.2),
    nn.Linear(1280, 128),
    nn.ReLU(),
    nn.Dropout(0.2),
    nn.Linear(128, 2),
)
_state_dict = torch.load(config.DEFECT_CLASSIFIER_PATH, map_location="cpu", weights_only=False)
_model.load_state_dict(_state_dict)
_model.eval()
_model.to(_device)

_transform = transforms.Compose([
    transforms.Resize((config.DEFECT_IMG_SIZE, config.DEFECT_IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(mean=config.IMAGENET_MEAN, std=config.IMAGENET_STD),
])

# Rough average garment lifespan (months) by fabric family, used only to
# turn "health score" into a "remaining lifespan" estimate. These are
# reasonable industry rule-of-thumb figures, not model outputs.
_BASE_LIFESPAN_MONTHS = {
    "Cotton": 24, "Linen": 24, "Canvas": 30, "Denim": 36, "Wool": 30,
    "Polyester": 30, "Nylon": 28, "Rayon": 18, "Viscose": 18,
    "Silk": 20, "Chiffon": 16, "Velvet": 22, "Satin": 18, "Fleece": 26,
    "Blended Fabric": 24, "Leather": 48,
}
_DEFAULT_LIFESPAN_MONTHS = 24


def _repairability_label(health_score: float) -> str:
    if health_score >= 80:
        return "Highly Repairable"
    if health_score >= 60:
        return "Moderately Repairable"
    if health_score >= 40:
        return "Repairable with Care"
    return "Limited Repairability"


def analyze_defects(image_bytes: bytes, fabric_type: str = "Blended Fabric") -> dict:
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    tensor = _transform(image).unsqueeze(0).to(_device)

    with torch.no_grad():
        logits = _model(tensor)
        probs = F.softmax(logits, dim=1)[0].cpu()

    defect_idx = (
        DEFECT_CLASSES.index("Defect")
        if "Defect" in DEFECT_CLASSES
        else 0
    )

    p_defect = float(probs[defect_idx])

    # Raw confidence (0-100)
    raw_defect_area = round(p_defect * 100, 2)

    # --------------------------------------------------
    # Custom display logic
    # < 40%   -> 0%
    # 40-49%  -> 20%
    # >= 50%  -> actual percentage
    # --------------------------------------------------
    if raw_defect_area < 40:
        defect_area = 0
    elif raw_defect_area < 50:
        defect_area = 20
    else:
        defect_area = raw_defect_area

    # Calculate health score
    health_score = round(
        max(0.0, min(100.0, 100.0 - defect_area)),
        2,
    )

    repairability = _repairability_label(health_score)

    # Remaining lifespan
    base_months = _BASE_LIFESPAN_MONTHS.get(
        fabric_type,
        _DEFAULT_LIFESPAN_MONTHS,
    )

    remaining_lifespan = round(
        base_months * (health_score / 100.0),
        1,
    )

    return {
        "defectArea": defect_area,
        "healthScore": health_score,
        "repairability": repairability,
        "remainingLifespan": remaining_lifespan,
    }