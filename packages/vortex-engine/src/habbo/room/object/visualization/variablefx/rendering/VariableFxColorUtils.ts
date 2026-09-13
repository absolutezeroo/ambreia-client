/**
 * Two colour operations the renderers need and Canvas cannot do for them.
 *
 * `scaleRgbValueInHsv` brightens or dims a colour without washing it out — the bars use it to
 * derive their highlight and shadow slices from one configured colour, and scaling RGB directly
 * would drag every channel toward grey instead.
 *
 * `blendVariableFxPixel` is a software `draw()` for the one case that cannot go through the
 * composer: a single pixel value, blended and composited by hand, which the prebakes use while
 * building their artwork off-canvas.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/rendering/VariableFxColorUtils.as
 */
export class VariableFxColorUtils
{
    /**
     * Scales a colour's HSV *value* by `scale`, keeping its hue and saturation.
     *
     * Round-trips through HSV rather than multiplying the channels: multiplying turns a saturated
     * red into a darker, duller red, where this keeps it red.
     */
    // AS3: .../rendering/VariableFxColorUtils.as::scaleRgbValueInHsv()
    static scaleRgbValueInHsv(rgb: number, scale: number): number
    {
        const r = VariableFxColorUtils.channelFromRgb(rgb, 16) / 255;
        const g = VariableFxColorUtils.channelFromRgb(rgb, 8) / 255;
        const b = VariableFxColorUtils.channelFromRgb(rgb, 0) / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const chroma = max - min;

        // The double modulo is AS3's: a hue section can come out negative, and `% 360` alone keeps
        // the sign.
        const hue = ((VariableFxColorUtils.resolveHue(r, g, b, max, chroma) % 360) + 360) % 360;
        const saturation = max === 0 ? 0 : chroma / max;

        const value = Math.max(0, Math.min(1, max * scale));
        const scaledChroma = value * saturation;
        const section = hue / 60;
        const secondary = scaledChroma * (1 - Math.abs((section % 2) - 1));
        const floor = value - scaledChroma;

        const channels = VariableFxColorUtils.resolveRgbFromHueSection(section, scaledChroma, secondary);

        return VariableFxColorUtils.rgbFromChannels(
            Math.floor((channels[0]! + floor) * 255),
            Math.floor((channels[1]! + floor) * 255),
            Math.floor((channels[2]! + floor) * 255)
        );
    }

    /**
     * Composites one ARGB pixel over another, in `normal`, `multiply` or `add`.
     *
     * Straight source-over with an un-premultiplied result: the blended colour is divided back out
     * by the resulting alpha, which is what keeps a half-transparent pixel from darkening as it is
     * composited. A zero result alpha returns 0 rather than dividing by it.
     */
    // AS3: .../rendering/VariableFxColorUtils.as::blendVariableFxPixel()
    static blendVariableFxPixel(destination: number, source: number, blendMode: string, opacity: number): number
    {
        const dstA = (destination >>> 24) & 0xFF;
        const dstR = (destination >>> 16) & 0xFF;
        const dstG = (destination >>> 8) & 0xFF;
        const dstB = destination & 0xFF;

        const srcA = (source >>> 24) & 0xFF;
        const srcR = (source >>> 16) & 0xFF;
        const srcG = (source >>> 8) & 0xFF;
        const srcB = source & 0xFF;

        const effectiveAlpha = srcA * VariableFxColorUtils.clampByte(opacity) / 255;

        if(effectiveAlpha <= 0) return destination;

        let blendedR = srcR;
        let blendedG = srcG;
        let blendedB = srcB;

        if(blendMode === 'multiply')
        {
            blendedR = VariableFxColorUtils.multiplyRgb(srcR, dstR);
            blendedG = VariableFxColorUtils.multiplyRgb(srcG, dstG);
            blendedB = VariableFxColorUtils.multiplyRgb(srcB, dstB);
        }
        else if(blendMode === 'add')
        {
            blendedR = Math.min(255, srcR + dstR);
            blendedG = Math.min(255, srcG + dstG);
            blendedB = Math.min(255, srcB + dstB);
        }

        const sa = effectiveAlpha / 255;
        const da = dstA / 255;
        const outA = sa + da * (1 - sa);

        if(outA <= 0) return 0;

        const dstWeight = da * (1 - sa);

        return (
            (VariableFxColorUtils.clampByte(Math.round(outA * 255)) << 24)
            | (VariableFxColorUtils.clampByte(Math.round((blendedR * sa + dstR * dstWeight) / outA)) << 16)
            | (VariableFxColorUtils.clampByte(Math.round((blendedG * sa + dstG * dstWeight) / outA)) << 8)
            | VariableFxColorUtils.clampByte(Math.round((blendedB * sa + dstB * dstWeight) / outA))
        ) >>> 0;
    }

    // AS3: .../rendering/VariableFxColorUtils.as::multiplyRgb()
    private static multiplyRgb(a: number, b: number): number
    {
        return VariableFxColorUtils.clampByte(
            Math.round(VariableFxColorUtils.clampByte(a) * VariableFxColorUtils.clampByte(b) / 255)
        );
    }

    /**
     * Clamps to a byte, TRUNCATING rather than rounding in between — AS3's `int()`. Callers that
     * want rounding round first, and several do.
     */
    // AS3: .../rendering/VariableFxColorUtils.as::clampByte()
    private static clampByte(value: number): number
    {
        if(value <= 0) return 0;

        if(value >= 255) return 255;

        return value | 0;
    }

    // AS3: .../rendering/VariableFxColorUtils.as::channelFromRgb()
    private static channelFromRgb(rgb: number, shift: number): number
    {
        return (rgb >>> shift) & 0xFF;
    }

    // AS3: .../rendering/VariableFxColorUtils.as::rgbFromChannels()
    private static rgbFromChannels(r: number, g: number, b: number): number
    {
        return (
            (VariableFxColorUtils.clampByte(r) << 16)
            | (VariableFxColorUtils.clampByte(g) << 8)
            | VariableFxColorUtils.clampByte(b)
        ) >>> 0;
    }

    // AS3: .../rendering/VariableFxColorUtils.as::resolveHue()
    private static resolveHue(r: number, g: number, b: number, max: number, chroma: number): number
    {
        if(chroma === 0) return 0;

        if(max === r) return 60 * (((g - b) / chroma) % 6);

        if(max === g) return 60 * ((b - r) / chroma + 2);

        return 60 * ((r - g) / chroma + 4);
    }

    // AS3: .../rendering/VariableFxColorUtils.as::resolveRgbFromHueSection()
    private static resolveRgbFromHueSection(section: number, chroma: number, secondary: number): number[]
    {
        if(section < 1) return [chroma, secondary, 0];

        if(section < 2) return [secondary, chroma, 0];

        if(section < 3) return [0, chroma, secondary];

        if(section < 4) return [0, secondary, chroma];

        if(section < 5) return [secondary, 0, chroma];

        return [chroma, 0, secondary];
    }
}
