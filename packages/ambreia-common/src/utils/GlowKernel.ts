/**
 * The blur kernel behind `GlowFilter`'s `quality`.
 *
 * Its own file, and not a private static on the filter, for one reason: `GlowFilter` extends a
 * PixiJS `Filter` and cannot be constructed outside a renderer, so anything living on it cannot be
 * checked without one. This is pure arithmetic, and `scripts/check-glow-kernel.mjs` runs it.
 */

/**
 * How many box folds are honoured.
 *
 * Folding a 5-tap box `q` times gives `4q + 1` taps, so 3 folds is 13 — and 13x13 is already 169
 * texture samples per pixel. Flash allows `quality` up to 15; anything above 3 is clamped here
 * rather than silently sampled at less than asked.
 */
// TS-only: Flash re-runs its blur per quality step; the shader widens its kernel instead, and a
//   GLSL array size has to be a compile-time literal.
export const GLOW_MAX_QUALITY: number = 3;

/** `4 * GLOW_MAX_QUALITY + 1`, spelled out because the GLSL array size is a literal. */
// TS-only: see GLOW_MAX_QUALITY.
export const GLOW_MAX_TAPS: number = 13;

/**
 * The 1-D kernel of `quality` successive box blurs, normalised so it sums to 1.
 *
 * `q` box passes of the same radius are one convolution with the box convolved into itself `q`
 * times — the discrete central-limit shape that converges on a Gaussian, which is exactly what
 * Flash's `quality` knob buys. Computing it here is what lets the shader stay a single pass: a
 * wider kernel instead of repeated passes over the whole surface.
 *
 * @param quality - Flash's `quality`, clamped to [1, {@link GLOW_MAX_QUALITY}]
 * @returns `4q + 1` weights, symmetric, summing to 1
 */
// TS-only: the CPU half of `flash.filters.GlowFilter.quality`.
export function foldedBoxWeights(quality: number): number[]
{
    const folds = Math.min(GLOW_MAX_QUALITY, Math.max(1, Math.round(quality)));

    let weights = [1, 1, 1, 1, 1];

    for(let fold = 1; fold < folds; fold++)
    {
        const folded = new Array<number>(weights.length + 4).fill(0);

        for(let i = 0; i < weights.length; i++)
        {
            for(let j = 0; j < 5; j++) folded[i + j] += weights[i];
        }

        weights = folded;
    }

    const total = weights.reduce((sum, weight) => sum + weight, 0);

    return weights.map(weight => weight / total);
}

/**
 * Pads a kernel out to the shader's fixed-size uniform array.
 *
 * The tail stays zero and is never read: `uTapCount` bounds both loops.
 */
// TS-only: a GLSL uniform array has a fixed size; the kernel does not.
export function padGlowWeights(weights: number[]): Float32Array
{
    const padded = new Float32Array(GLOW_MAX_TAPS);

    padded.set(weights);

    return padded;
}
