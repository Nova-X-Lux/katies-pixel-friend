from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public" / "pets"
ICON_DIR = ROOT / "public" / "icons"


def normalise(path: Path) -> None:
    image = Image.open(path).convert("RGBA")
    alpha = image.getchannel("A")
    bbox = alpha.getbbox()
    if not bbox:
        raise RuntimeError(f"No visible pixels in {path}")
    cropped = image.crop(bbox)
    cropped.thumbnail((228, 228), Image.Resampling.NEAREST)
    canvas = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
    x = (256 - cropped.width) // 2
    y = 246 - cropped.height
    canvas.alpha_composite(cropped, (x, y))
    canvas.save(path, optimize=True)


for pet_path in SOURCE.glob("*.png"):
    normalise(pet_path)

ICON_DIR.mkdir(parents=True, exist_ok=True)
cat = Image.open(SOURCE / "cat.png").convert("RGBA")
for size in (192, 512):
    background = Image.new("RGBA", (size, size), (201, 130, 147, 255))
    pet = cat.resize((int(size * 0.84), int(size * 0.84)), Image.Resampling.NEAREST)
    background.alpha_composite(pet, ((size - pet.width) // 2, size - pet.height))
    background.save(ICON_DIR / f"icon-{size}.png", optimize=True)
