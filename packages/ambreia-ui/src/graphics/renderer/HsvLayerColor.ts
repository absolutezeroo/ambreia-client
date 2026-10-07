/**
 * Color transform shape matching the Flash `ColorTransform` fields used
 * elsewhere in the engine (see `WindowController.dynamicStyleColor`).
 */
export interface IColorTransform
{
    redMultiplier: number;
    greenMultiplier: number;
    blueMultiplier: number;
    alphaMultiplier: number;
    redOffset: number;
    greenOffset: number;
    blueOffset: number;
    alphaOffset: number;
}

/**
 * Derives HSV-shaded variants of a color (used for stroke shading relative
 * to a shape's fill color).
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/HsvLayerColor.as
 */
export class HsvLayerColor
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/HsvLayerColor.as::configureTransform()
    public static configureTransform(transform: IColorTransform, color: number, shade: number): void
    {
        const derived = HsvLayerColor.deriveColor(color, shade);

        transform.redMultiplier = ((derived & 0xFF0000) >> 16) / 255;
        transform.greenMultiplier = ((derived & 0xFF00) >> 8) / 255;
        transform.blueMultiplier = (derived & 0xFF) / 255;
        transform.alphaMultiplier = 1;
        transform.redOffset = 0;
        transform.greenOffset = 0;
        transform.blueOffset = 0;
        transform.alphaOffset = 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/HsvLayerColor.as::deriveColor()
    public static deriveColor(color: number, shade: number): number
    {
        if(Number.isNaN(shade))
        {
            shade = 0;
        }

        const r = ((color & 0xFF0000) >> 16) / 255;
        const g = ((color & 0xFF00) >> 8) / 255;
        const b = (color & 0xFF) / 255;

        const hsv = HsvLayerColor.rgbToHsv(r, g, b);

        if(hsv.s === 0)
        {
            hsv.s = 0;
            hsv.v -= shade;
        }
        else
        {
            hsv.s = HsvLayerColor.clamp01(hsv.s + shade);
            hsv.v = HsvLayerColor.clamp01(hsv.v - shade / 2);
        }

        return HsvLayerColor.hsvToRgb(hsv.h, hsv.s, hsv.v);
    }

    // AS3: .../src/com/sulake/core/window/graphics/renderer/HsvLayerColor.as::rgbToHsv()
    private static rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number }
    {
        const max = Math.max(r, Math.max(g, b));
        const min = Math.min(r, Math.min(g, b));
        const delta = max - min;
        const s = max === 0 ? 0 : delta / max;
        let h = 0;

        if(delta !== 0)
        {
            if(max === r)
            {
                h = (g - b) / delta;

                if(g < b)
                {
                    h += 6;
                }
            }
            else if(max === g)
            {
                h = (b - r) / delta + 2;
            }
            else
            {
                h = (r - g) / delta + 4;
            }

            h /= 6;
        }

        return {h, s, v: max};
    }

    // AS3: .../src/com/sulake/core/window/graphics/renderer/HsvLayerColor.as::hsvToRgb()
    private static hsvToRgb(h: number, s: number, v: number): number
    {
        h -= Math.floor(h);

        if(s === 0)
        {
            return HsvLayerColor.toColor(v, v, v);
        }

        const sector = h * 6;
        const i = Math.floor(sector);
        const f = sector - i;
        const p = v * (1 - s);
        const q = v * (1 - s * f);
        const t = v * (1 - s * (1 - f));

        switch(i % 6)
        {
            case 0:
                return HsvLayerColor.toColor(v, t, p);
            case 1:
                return HsvLayerColor.toColor(q, v, p);
            case 2:
                return HsvLayerColor.toColor(p, v, t);
            case 3:
                return HsvLayerColor.toColor(p, q, v);
            case 4:
                return HsvLayerColor.toColor(t, p, v);
            default:
                return HsvLayerColor.toColor(v, p, q);
        }
    }

    // AS3: .../src/com/sulake/core/window/graphics/renderer/HsvLayerColor.as::toColor()
    private static toColor(r: number, g: number, b: number): number
    {
        return (HsvLayerColor.toByte(r) << 16) | (HsvLayerColor.toByte(g) << 8) | HsvLayerColor.toByte(b);
    }

    // AS3: .../src/com/sulake/core/window/graphics/renderer/HsvLayerColor.as::toByte()
    private static toByte(value: number): number
    {
        return Math.round(HsvLayerColor.clamp01(value) * 255) >>> 0;
    }

    // AS3: .../src/com/sulake/core/window/graphics/renderer/HsvLayerColor.as::clamp01()
    private static clamp01(value: number): number
    {
        if(Number.isNaN(value) || value < 0)
        {
            return 0;
        }

        if(value > 1)
        {
            return 1;
        }

        return value;
    }
}
