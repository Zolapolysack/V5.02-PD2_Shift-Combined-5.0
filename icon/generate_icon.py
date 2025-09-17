from PIL import Image, ImageFilter, ImageOps, ImageDraw
import os

# Paths
HERE = os.path.dirname(__file__)
SRC = os.path.join(HERE, 'images.png')
PREVIEW = os.path.join(HERE, 'icon_preview.png')
OUT_ICO = os.path.join(HERE, 'icon.ico')
PREVIEW_SHARP = os.path.join(HERE, 'icon_preview_sharp.png')
OUT_ICO_SHARP = os.path.join(HERE, 'icon_sharp.ico')

# Target sizes for modern .ico
SIZES = [256, 128, 64, 48, 32, 16]

# Load source
im = Image.open(SRC).convert('RGBA')
# Upscale if very small
min_dim = min(im.size)
if min_dim < 256:
    scale = 256 / min_dim
    new_size = (int(im.width * scale), int(im.height * scale))
    im = im.resize(new_size, Image.LANCZOS)

# Center-crop to square
w, h = im.size
side = min(w, h)
left = (w - side) // 2
top = (h - side) // 2
im = im.crop((left, top, left + side, top + side))

# Apply slight contrast and sharpening
# autocontrast doesn't support RGBA directly: split alpha, process RGB, then recombine
r, g, b, a = im.split()
rgb = Image.merge('RGB', (r, g, b))
rgb = ImageOps.autocontrast(rgb, cutoff=1)
rgb = rgb.filter(ImageFilter.UnsharpMask(radius=2, percent=150, threshold=3))
r, g, b = rgb.split()
im = Image.merge('RGBA', (r, g, b, a))

# Create circular mask with antialiasing
mask_size = im.size[0]*4
mask = Image.new('L', (mask_size, mask_size), 0)
draw = ImageDraw.Draw(mask)
draw.ellipse((0,0,mask_size,mask_size), fill=255)
mask = mask.resize(im.size, Image.LANCZOS)

# Apply mask
im.putalpha(mask)

# Add subtle border (ring) by compositing
border = Image.new('RGBA', im.size, (0,0,0,0))
d = ImageDraw.Draw(border)
# white ring with slight transparency
ring_width = max(2, im.size[0] // 64)
d.ellipse((ring_width//2, ring_width//2, im.size[0]-ring_width//2, im.size[1]-ring_width//2), outline=(255,255,255,200), width=ring_width)

# Add subtle drop shadow
shadow = Image.new('RGBA', (im.size[0]+8, im.size[1]+8), (0,0,0,0))
shadow_mask = mask.copy().resize((im.size[0], im.size[1]), Image.LANCZOS)
shadow.paste((0,0,0,120), (4,4), shadow_mask)
shadow = shadow.filter(ImageFilter.GaussianBlur(4))

# Compose final preview onto transparent background slightly larger to show shadow
bg_size = (im.size[0]+8, im.size[1]+8)
bg = Image.new('RGBA', bg_size, (0,0,0,0))
bg.paste(shadow, (0,0), shadow)
bg.paste(im, (4,4), im)
# draw border over pasted image (border needs offset)
bg.paste(border, (4,4), border)

# Save preview
bg.save(PREVIEW)
print('Wrote', PREVIEW)

# Create icons at required sizes from the cropped circular image (no extra shadow for small sizes)
icons = []
for size in SIZES:
    icon = im.resize((size, size), Image.LANCZOS)
    # for smallest sizes, remove alpha smoothing tack if needed
    icons.append(icon)

# Save multi-size ICO
icons[0].save(OUT_ICO, format='ICO', sizes=[(s,s) for s in SIZES])
print('Wrote', OUT_ICO)

# --- Stronger enhancement variant ---
# create a copy and apply stronger contrast and sharpening
im2 = im.copy()
# Increase contrast by enhancing histogram (approx) and stronger unsharp
rgb = im2.convert('RGB')
rgb = ImageOps.autocontrast(rgb, cutoff=0)
rgb = rgb.filter(ImageFilter.UnsharpMask(radius=1.5, percent=300, threshold=1))
r2, g2, b2 = rgb.split()
im2 = Image.merge('RGBA', (r2, g2, b2, im2.split()[3]))

# create preview for sharp variant (no big shadow to preserve crispness)
bg2 = Image.new('RGBA', (im2.size[0]+6, im2.size[1]+6), (0,0,0,0))
bg2.paste(im2, (3,3), im2)
draw2 = ImageDraw.Draw(bg2)
ring_width2 = max(2, im2.size[0] // 48)
draw2.ellipse((3+ring_width2//2,3+ring_width2//2,bg2.size[0]-3-ring_width2//2,bg2.size[1]-3-ring_width2//2), outline=(255,255,255,220), width=ring_width2)
bg2.save(PREVIEW_SHARP)
print('Wrote', PREVIEW_SHARP)

# icons for sharp variant
icons_sharp = []
for size in SIZES:
    icon = im2.resize((size, size), Image.LANCZOS)
    icons_sharp.append(icon)
icons_sharp[0].save(OUT_ICO_SHARP, format='ICO', sizes=[(s,s) for s in SIZES])
print('Wrote', OUT_ICO_SHARP)
