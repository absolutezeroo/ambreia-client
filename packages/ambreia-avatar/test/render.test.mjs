// Spec §11, J2: an avatar rendered in Node matches its reference image. The references are Node
// renders with trimmed Nitro parts placed at their trim offset (see the bilan of J2).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadImage, createCanvas } from '@napi-rs/canvas';

const FIGURE = 'hd-180-2.hr-828-31.ch-255-1408.lg-280-110.sh-305-62';

// Direction 2 is drawn as is; direction 4 is mirrored, where trimmed parts are hardest to place.
const CASES = [['2', 'reference-hd-180-2.png'], ['4', 'reference-hd-180-dir4.png']];

const SKIP = !process.env.AMBREIA_ASSETS
    && 'set AMBREIA_ASSETS to the asset server, and run node install.mjs for the embedded avatar XMLs';

async function pixels(file)
{
    const image = await loadImage(file);
    const canvas = createCanvas(image.width, image.height);
    canvas.getContext('2d').drawImage(image, 0, 0);
    return { width: image.width, height: image.height, data: canvas.getContext('2d').getImageData(0, 0, image.width, image.height).data };
}

for(const [direction, fixture] of CASES)
{
    test(`an avatar rendered in Node matches the reference, direction ${direction}`, { skip: SKIP }, async () =>
    {
        const out = join(mkdtempSync(join(tmpdir(), 'avatar-')), 'out.png');

        execFileSync(process.execPath, ['node_modules/tsx/dist/cli.mjs', '--tsconfig', 'packages/ambreia-avatar/tsconfig.json',
            'packages/ambreia-avatar/tools/render-avatar.mjs', FIGURE, out, '--direction', direction, '--zoom', '2'], { stdio: 'inherit' });

        const [got, want] = await Promise.all([pixels(out), pixels(`packages/ambreia-avatar/test/fixtures/${fixture}`)]);

        assert.deepEqual([got.width, got.height], [want.width, want.height]);

        let differing = 0;
        for(let i = 0; i < got.data.length; i += 4)
        {
            if(Math.abs(got.data[i] - want.data[i]) + Math.abs(got.data[i + 1] - want.data[i + 1]) + Math.abs(got.data[i + 2] - want.data[i + 2]) + Math.abs(got.data[i + 3] - want.data[i + 3]) > 8) differing++;
        }

        assert.ok(differing / (got.data.length / 4) < 0.005, `${differing} pixels differ`);
    });
}
