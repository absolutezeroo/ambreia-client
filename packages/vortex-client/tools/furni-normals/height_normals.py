"""mobi.png -> nearest upscale -> depth (Depth Anything V2) -> cleanup -> heightmap -> normal map.

usage: height_normals.py <normals-test dir> [small|large] [strength]
    Reads <dir>/furni/*.png, writes <dir>/normals/pipeline-<size>/<name>_h.png (16-bit height) and <name>_n.png,
    and <dir>/pipeline-<size>-contact.png (furni, height, normals).
usage: height_normals.py --sheets <dir> [small|large] [strength]
    For each <dir>/<furni>/ written by furni-sheets.ts (sheet.png, frames.json): every image of the sheet on its
    own, put back where it is, into sheet_n.png and sheet_h.png (8-bit height): an animated furni gets the maps of
    each of its frames.
"""
import json
import os
import sys

import numpy as np
from PIL import Image
from transformers import pipeline

sheets = sys.argv[1] == '--sheets'
args = sys.argv[2:] if sheets else sys.argv[1:]
root = args[0]
size = args[1] if len(args) > 1 else 'large'
strength = float(args[2]) if len(args) > 2 else 30.0

estimate = pipeline('depth-estimation', model='depth-anything/Depth-Anything-V2-' + size.capitalize() + '-hf')
UPSCALE = 4
MARGIN = 8
RADIUS = 4      # the cleanup's window, in upscaled pixels: one sprite pixel
EPSILON = 1e-3  # how far the height may stray from the drawing's edges


def box(values, radius):
    """Mean over a (2r+1)² window, edges clamped (an integral image)."""
    padded = np.pad(values, radius + 1, mode='edge')
    total = padded.cumsum(0).cumsum(1)
    n = 2 * radius + 1
    return (total[n:, n:] - total[:-n, n:] - total[n:, :-n] + total[:-n, :-n])[:values.shape[0], :values.shape[1]] / (n * n)


def masked_box(values, mask, radius):
    """Mean of the furni's own pixels only: the ground around it does not leak in."""
    return box(values * mask, radius) / np.maximum(box(mask, radius), 1e-6)


def guided(guide, height, mask):
    """Guided filter (He et al.): the height made smooth inside the drawing's flat colours, its steps kept on its edges."""
    mean_i = masked_box(guide, mask, RADIUS)
    mean_p = masked_box(height, mask, RADIUS)
    var_i = masked_box(guide * guide, mask, RADIUS) - mean_i * mean_i
    cov = masked_box(guide * height, mask, RADIUS) - mean_i * mean_p
    a = cov / (var_i + EPSILON)
    b = mean_p - a * mean_i
    return masked_box(a, mask, RADIUS) * guide + masked_box(b, mask, RADIUS)


def slopes(height, mask):
    """Central differences between the furni's own pixels; one-sided on its outline, so the outline is no cliff."""
    def along(axis):
        ahead = np.roll(height, -1, axis)
        behind = np.roll(height, 1, axis)
        has_ahead = np.roll(mask, -1, axis) > 0
        has_behind = np.roll(mask, 1, axis) > 0
        both = (ahead - behind) / 2
        return np.where(has_ahead & has_behind, both, np.where(has_ahead, ahead - height, np.where(has_behind, height - behind, 0)))

    return along(1), along(0)


def maps(furni):
    """An RGBA picture's heightmap (0..1, its size) and normal map (RGBA, its alpha); None when it is empty."""
    width, height = furni.size

    # 1. Upscale, nearest: a neutral grey ground, a margin, four times bigger, the pixels kept sharp.
    ground = Image.new('RGB', (width + MARGIN * 2, height + MARGIN * 2), (128, 128, 128))
    ground.paste(furni, (MARGIN, MARGIN), furni)
    big = ground.resize((ground.width * UPSCALE, ground.height * UPSCALE), Image.NEAREST)
    framed = Image.new('RGBA', ground.size, (0, 0, 0, 0))
    framed.paste(furni, (MARGIN, MARGIN))
    mask = (np.asarray(framed.resize(big.size, Image.NEAREST))[:, :, 3] > 25).astype(np.float32)
    inside = mask > 0

    if not inside.any():
        return None
    guide = np.asarray(big.convert('L'), dtype=np.float32) / 255

    # 2. Depth by the model (larger: nearer), at the upscaled size.
    depth = estimate(big)['predicted_depth'].squeeze().cpu().numpy().astype(np.float32)
    depth = np.asarray(Image.fromarray(depth).resize(big.size, Image.BILINEAR), dtype=np.float32)

    # 3. Cleanup: 0..1 over the furni (2-98 percentiles, outliers clipped), then edge-aware smoothing.
    low, high = np.percentile(depth[inside], 2), np.percentile(depth[inside], 98)
    depth = np.clip((depth - low) / max(high - low, 1e-6), 0, 1)
    depth = np.clip(guided(guide, depth, mask), 0, 1) * mask

    # 4. Final heightmap: back to the sprite's size (area average over the furni's pixels).
    cut = (slice(MARGIN * UPSCALE, (MARGIN + height) * UPSCALE), slice(MARGIN * UPSCALE, (MARGIN + width) * UPSCALE))
    small = lambda values: values[cut].reshape(height, UPSCALE, width, UPSCALE).mean((1, 3))
    coverage = small(mask)
    final_height = np.where(coverage > 0, small(depth) / np.maximum(coverage, 1e-6), 0)

    # 5. Final normal map from the clean height (upscaled, then averaged down), y down the picture.
    dx, dy = slopes(depth, mask)
    nx, ny, nz = -dx * strength * UPSCALE, -dy * strength * UPSCALE, np.ones_like(depth)
    length = np.sqrt(nx * nx + ny * ny + nz * nz)
    nx, ny, nz = small(nx / length * mask), small(ny / length * mask), small(nz / length * mask)
    length = np.maximum(np.sqrt(nx * nx + ny * ny + nz * nz), 1e-6)
    rgba = np.zeros((height, width, 4), dtype=np.uint8)
    rgba[:, :, 0] = ((nx / length) * 0.5 + 0.5) * 255
    rgba[:, :, 1] = ((ny / length) * 0.5 + 0.5) * 255
    rgba[:, :, 2] = ((nz / length) * 0.5 + 0.5) * 255
    rgba[:, :, 3] = np.asarray(furni)[:, :, 3]
    return final_height, rgba


def pictures():
    """The test page's exported furni, each with its maps; a contact sheet."""
    source = os.path.join(root, 'furni')
    target = os.path.join(root, 'normals', 'pipeline-' + size)
    os.makedirs(target, exist_ok=True)
    previews = []

    for name in sorted(os.listdir(source)):
        if not name.endswith('.png'):
            continue

        furni = Image.open(os.path.join(source, name)).convert('RGBA')
        made = maps(furni)

        if made is None:
            continue
        final_height, rgba = made
        Image.fromarray((final_height * 65535).astype(np.uint16)).save(os.path.join(target, name[:-4] + '_h.png'))
        Image.fromarray(rgba, 'RGBA').save(os.path.join(target, name[:-4] + '_n.png'))

        shown_height = np.dstack([(final_height * 255).astype(np.uint8)] * 3 + [rgba[:, :, 3]])
        previews.append((furni, Image.fromarray(shown_height, 'RGBA'), Image.fromarray(rgba, 'RGBA')))
        print(name[:-4], flush=True)

    cell = 96
    sheet = Image.new('RGB', (cell * 3 * 5, cell * ((len(previews) + 4) // 5)), (50, 54, 70))

    for i, pictures_of in enumerate(previews):
        for j, picture in enumerate(pictures_of):
            thumb = picture.copy()
            thumb.thumbnail((cell - 6, cell - 6))
            sheet.paste(thumb, ((i % 5) * cell * 3 + j * cell + 3, (i // 5) * cell + 3), thumb)

    sheet.save(os.path.join(root, 'pipeline-' + size + '-contact.png'))
    print('done', len(previews))


def sheet_maps():
    """Each furni's sheet, image by image: what is drawn plain gets its maps, the rest stays empty."""
    for furni in sorted(os.listdir(root)):
        folder = os.path.join(root, furni)

        if not os.path.exists(os.path.join(folder, 'frames.json')):
            continue

        sheet = Image.open(os.path.join(folder, 'sheet.png')).convert('RGBA')
        frames = json.load(open(os.path.join(folder, 'frames.json'), encoding='utf-8'))
        normal_sheet = Image.new('RGBA', sheet.size, (128, 128, 255, 0))
        height_sheet = Image.new('LA', sheet.size, (0, 0))
        done = set()

        for frame in frames:
            rect = (frame['x'], frame['y'], frame['x'] + frame['w'], frame['y'] + frame['h'])

            # A shadow or a glow is no surface; tiny images have nothing to estimate.
            if frame['skip'] or rect in done or frame['w'] < 4 or frame['h'] < 4:
                continue
            done.add(rect)
            made = maps(sheet.crop(rect))

            if made is None:
                continue
            final_height, rgba = made
            normal_sheet.paste(Image.fromarray(rgba, 'RGBA'), rect[:2])
            height_sheet.paste(Image.fromarray(np.dstack([(final_height * 255).astype(np.uint8), rgba[:, :, 3]]), 'LA'), rect[:2])

        normal_sheet.save(os.path.join(folder, 'sheet_n.png'))
        height_sheet.save(os.path.join(folder, 'sheet_h.png'))
        print(furni, len(done), 'images', flush=True)


if sheets:
    sheet_maps()
else:
    pictures()
