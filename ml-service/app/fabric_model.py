"""
Fabric type classifier.

Architecture confirmed by loading the checkpoint into a stock timm
`efficientnet_b3` model with strict state_dict matching (0 missing / 0
unexpected keys): conv_stem width 40, head width 1536, classifier
16-way -> this is a 16-class EfficientNet-B3 image classifier.

IMPORTANT: the classifier's output size (currently 16) is fixed inside the
checkpoint's own weights (classifier.weight has shape [16, 1536]) - it is
NOT determined by how many entries are in fabric_classes.json. Editing that
file to add or remove class names does not resize the trained model, and
previously caused a hard crash on startup:

    RuntimeError: size mismatch for classifier.weight: copying a param with
    shape torch.Size([16, 1536]) from checkpoint, the shape in current
    model is torch.Size([18, 1536]).

Fix: the model is now always built using the class count read directly
from the checkpoint itself (ground truth, can't be wrong), never from
fabric_classes.json's length. fabric_classes.json is only used as a label
lookup after that. If it has the wrong number of entries, the service logs
a clear warning and pads/truncates with generic "Class N" placeholders
instead of crashing - you can still rename entries in fabric_classes.json,
you just can't change how many there are (that number is fixed by the
checkpoint, currently 16).
"""
import io
import torch
import torch.nn.functional as F
import timm
from PIL import Image
from torchvision import transforms

from app import config

_device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

_state_dict = torch.load(config.FABRIC_CLASSIFIER_PATH, map_location="cpu", weights_only=False)
_checkpoint_num_classes = _state_dict["classifier.weight"].shape[0]

if _checkpoint_num_classes != len(config.FABRIC_CLASSES):
    print(
        f"[fabric_model] WARNING: fabric_classes.json has {len(config.FABRIC_CLASSES)} "
        f"entries, but the checkpoint's classifier layer outputs "
        f"{_checkpoint_num_classes} classes. Building the model with "
        f"{_checkpoint_num_classes} classes (the checkpoint is always right about "
        f"this) and padding/truncating labels so startup doesn't crash. "
        f"Fix models/fabric_classes.json to have exactly {_checkpoint_num_classes} "
        f"entries (you can rename them, just not add or remove any)."
    )
    FABRIC_CLASSES = list(config.FABRIC_CLASSES)[:_checkpoint_num_classes]
    while len(FABRIC_CLASSES) < _checkpoint_num_classes:
        FABRIC_CLASSES.append(f"Class {len(FABRIC_CLASSES)}")
else:
    FABRIC_CLASSES = config.FABRIC_CLASSES

_model = timm.create_model("efficientnet_b3", pretrained=False, num_classes=_checkpoint_num_classes)
_model.load_state_dict(_state_dict)
_model.eval()
_model.to(_device)

_transform = transforms.Compose([
    transforms.Resize((config.CLASSIFIER_IMG_SIZE, config.CLASSIFIER_IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(mean=config.IMAGENET_MEAN, std=config.IMAGENET_STD),
])


def classify_fabric(image_bytes: bytes) -> dict:
    """Run the fabric-type classifier on a single image.

    Returns the predicted fabric type name, the model's confidence (%),
    and the full class probability distribution.
    """
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    tensor = _transform(image).unsqueeze(0).to(_device)

    with torch.no_grad():
        logits = _model(tensor)
        probs = F.softmax(logits, dim=1)[0].cpu()

    top_prob, top_idx = torch.max(probs, dim=0)
    fabric_type = FABRIC_CLASSES[top_idx.item()]
    confidence = round(top_prob.item() * 100, 2)

    distribution = {
        FABRIC_CLASSES[i]: round(probs[i].item() * 100, 2)
        for i in range(len(FABRIC_CLASSES))
    }

    return {
        "fabricType": fabric_type,
        "classIndex": top_idx.item(),
        "confidence": confidence,
        "distribution": distribution,
    }
