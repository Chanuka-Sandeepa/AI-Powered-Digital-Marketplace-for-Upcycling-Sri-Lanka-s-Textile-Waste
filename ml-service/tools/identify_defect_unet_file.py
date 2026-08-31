"""
Figures out what's ACTUALLY inside models/defect_unet.pth, since the error
you're seeing shows key names that don't match a U-Net at all (they match
MobileNetV2's naming instead). Run this directly - no server needed.

Usage (from the ml-service folder):
    python tools/identify_defect_unet_file.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import torch

MODELS_DIR = Path(__file__).resolve().parent.parent / "models"
path = MODELS_DIR / "defect_unet.pth"

print(f"Loading {path} ...")
state_dict = torch.load(path, map_location="cpu", weights_only=False)

if not isinstance(state_dict, dict):
    print(f"This file isn't a plain state_dict - it's a {type(state_dict)}.")
    sys.exit(0)

keys = list(state_dict.keys())
print(f"\nTotal keys: {len(keys)}")
print("First 5 keys:", keys[:5])
print("Last 5 keys:", keys[-5:])

# Check for the exact MobileNetV2 pattern seen in the crash
has_features_prefix = any(k.startswith("features.") for k in keys)
has_classifier_prefix = any(k.startswith("classifier.") for k in keys)
has_unet_prefix = any(k.startswith("encoder.") or k.startswith("decoder.") for k in keys)

print(f"\nHas 'features.*' keys (MobileNet-family pattern): {has_features_prefix}")
print(f"Has 'classifier.*' keys: {has_classifier_prefix}")
print(f"Has 'encoder.*'/'decoder.*' keys (U-Net pattern): {has_unet_prefix}")

if has_classifier_prefix:
    classifier_keys = sorted(k for k in keys if k.startswith("classifier."))
    print(f"\nClassifier keys: {classifier_keys}")
    # The final Linear layer's weight shape tells us the number of output classes
    final_linear_keys = [k for k in classifier_keys if k.endswith(".weight")]
    if final_linear_keys:
        last_key = final_linear_keys[-1]
        shape = state_dict[last_key].shape
        print(f"\n'{last_key}' shape: {tuple(shape)}")
        print(f"-> This looks like a CLASSIFIER with {shape[0]} output classes,")
        print(f"   not a segmentation model at all.")

if has_unet_prefix:
    print("\nThis DOES look like a U-Net after all (has encoder./decoder. keys).")
    print("If you're still seeing the crash, double check you saved this diagnostic")
    print("output AFTER replacing the file, not before.")

print("\n" + "=" * 70)
if has_features_prefix and has_classifier_prefix and not has_unet_prefix:
    print("CONCLUSION: models/defect_unet.pth is a MobileNetV2-based CLASSIFIER,")
    print("not the ResNet34 U-Net segmentation model this service expects there.")
    print("This is very likely a mixed-up file - check your other .pth files")
    print("(e.g. fabric_classifier.pth) to see if they got swapped or if you have")
    print("an extra/different model file that should go here instead.")
print("=" * 70)
