"""
Figures out the REAL fabric_classes.json order using photos you already
know the true fabric type of - no training notebook required.

HOW TO USE
----------
1. Take a few clear photos of fabrics you know for certain (a cotton shirt,
   a denim swatch, a silk scarf, etc). 2-3 photos per type is plenty.
2. Put them in folders named after the TRUE label, like this:

   ml-service/tools/known_samples/
       cotton/
           photo1.jpg
           photo2.jpg
       denim/
           photo1.jpg
       silk/
           photo1.jpg
       ...

   (folder names are just for your own reference, they can be anything)

3. From the ml-service folder, run:

       python tools/identify_labels.py tools/known_samples

4. It prints, for each of your folders, which class INDEX (0-15) the model
   fires on most often. Use that to build the correct fabric_classes.json:
   whichever index came up for "cotton" -> put "Cotton" at that position
   in the "classes" list (position = array index, counting from 0).

You won't necessarily get all 16 positions this way (you'd need a sample of
every single fabric type the model was trained on) - but even partially
correcting the most common categories (cotton, polyester, denim, etc.) will
fix the vast majority of real-world misclassifications.
"""
import sys
import json
from pathlib import Path
from collections import Counter, defaultdict

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import fabric_model, config  # noqa: E402


def main():
    if len(sys.argv) < 2:
        print("Usage: python tools/identify_labels.py <path-to-known_samples-folder>")
        sys.exit(1)

    root = Path(sys.argv[1])
    if not root.is_dir():
        print(f"Not a folder: {root}")
        sys.exit(1)

    label_folders = [d for d in sorted(root.iterdir()) if d.is_dir()]
    if not label_folders:
        print(f"No subfolders found inside {root}. See the docstring at the top of this file for the expected layout.")
        sys.exit(1)

    print(f"Current guessed labels (index -> name): {list(enumerate(config.FABRIC_CLASSES))}\n")

    index_votes = defaultdict(Counter)

    for folder in label_folders:
        images = [p for p in folder.iterdir() if p.suffix.lower() in {".jpg", ".jpeg", ".png"}]
        if not images:
            print(f"[{folder.name}] no images found, skipping")
            continue

        print(f"[{folder.name}] testing {len(images)} image(s)...")
        for img_path in images:
            with open(img_path, "rb") as f:
                image_bytes = f.read()
            result = fabric_model.classify_fabric(image_bytes)
            predicted_index = config.FABRIC_CLASSES.index(result["fabricType"])
            index_votes[folder.name][predicted_index] += 1
            print(f"    {img_path.name}: current guess='{result['fabricType']}' (index {predicted_index}), confidence={result['confidence']}%")

    print("\n" + "=" * 60)
    print("RESULTS: most common predicted index per known fabric type")
    print("=" * 60)

    suggested = dict(enumerate(config.FABRIC_CLASSES))  # start from current guesses
    for true_label, votes in index_votes.items():
        best_index, count = votes.most_common(1)[0]
        total = sum(votes.values())
        print(f"  '{true_label}' -> index {best_index}  ({count}/{total} images agreed)")
        suggested[best_index] = true_label.capitalize()

    print("\nSuggested fabric_classes.json 'classes' list (edit names as needed):")
    print(json.dumps([suggested[i] for i in range(len(suggested))], indent=2))


if __name__ == "__main__":
    main()
