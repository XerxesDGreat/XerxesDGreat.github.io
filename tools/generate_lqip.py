import sys
import os
from PIL import Image, ImageFilter

SRC_ROOT = "assets/img/posts"
DEST_ROOT = "assets/img/lqip/posts"
LQIP_SIZE = (40, 40)  # thumbnail size for LQIP (can tweak)
LQIP_QUALITY = 20     # JPEG quality for compressed LQIP

def needs_update(source, lqip):
    return (not os.path.exists(lqip)) or (
        os.path.getmtime(source) > os.path.getmtime(lqip)
    )

def generate_lqip_for_image(src_path):
    # Calculate relative path from SRC_ROOT
    rel_path = os.path.relpath(src_path, SRC_ROOT)
    dest_path = os.path.splitext(os.path.join(DEST_ROOT, rel_path))[0] + ".jpg"

    if not needs_update(src_path, dest_path):
        return False

    # Make sure destination directory exists
    dest_dir = os.path.dirname(dest_path)
    os.makedirs(dest_dir, exist_ok=True)

    # Open, resize, blur, save compressed
    try:
        with Image.open(src_path) as img:
            img = img.convert("RGB")
            img.thumbnail(LQIP_SIZE, Image.LANCZOS)
            img = img.filter(ImageFilter.GaussianBlur(1))
            img.save(dest_path, "JPEG", quality=LQIP_QUALITY)
            print(f"LQIP generated: {dest_path}")
    except Exception as e:
        print(f"Failed to process {src_path}: {e}")
        return False
    return True

def main():
    if len(sys.argv) < 2:
        print("Usage: python generate_lqip.py <image1> <image2> ...")
        sys.exit(1)

    images_generated = []

    for image_path in sys.argv[1:]:
        print(image_path)
        if os.path.isfile(image_path) and image_path.startswith(SRC_ROOT):
            if generate_lqip_for_image(image_path):
                images_generated.append(image_path)
        else:
            print(f"Skipping non-matching or missing file: {image_path}")

    if len(images_generated) > 0:
        print("")
        print("There were LQIP images generated; please stage them and recommit")
        for img in images_generated:
            print("  %s" % img)
        sys.exit(1)

if __name__ == "__main__":
    main()
