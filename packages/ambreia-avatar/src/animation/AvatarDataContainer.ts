import type {IAvatarDataContainer} from './IAvatarDataContainer';

/**
 * Container for avatar color and ink data used in effect animations.
 *
 * @see sources/win63_version/habbo/avatar/animation/AvatarDataContainer.as
 */
export class AvatarDataContainer implements IAvatarDataContainer
{
    constructor(data: any)
    {
        this._ink = parseInt(data.ink) || 0;

        const foreground = String(data.foreground || '').replace('#', '');
        const background = String(data.background || '').replace('#', '');

        const fgColor = parseInt(foreground, 16) || 0;
        const bgColor = parseInt(background, 16) || 0;

        const r = (fgColor >> 16) & 0xFF;
        const g = (fgColor >> 8) & 0xFF;
        const b = fgColor & 0xFF;

        const redMultiplier = r / 255;
        const greenMultiplier = g / 255;
        const blueMultiplier = b / 255;
        let alphaMultiplier = 1;

        if(this._ink === 37)
        {
            alphaMultiplier = 0.5;
            this._paletteIsGrayscale = false;
        }

        this._colorTransform = {redMultiplier, greenMultiplier, blueMultiplier, alphaMultiplier};

        const palette = this.generatePaletteMapForGrayscale(bgColor, fgColor);

        this._reds = palette.reds;
        this._greens = palette.greens;
        this._blues = palette.blues;
        this._alphas = palette.alphas;
    }

    private _ink: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/AvatarDataContainer.as::get ink()
    public get ink(): number
    {
        return this._ink;
    }

    private _colorTransform: {
        redMultiplier: number;
        greenMultiplier: number;
        blueMultiplier: number;
        alphaMultiplier: number
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/AvatarDataContainer.as::get colorTransform()
    public get colorTransform(): {
        redMultiplier: number;
        greenMultiplier: number;
        blueMultiplier: number;
        alphaMultiplier: number
    }
    {
        return this._colorTransform;
    }

    private _paletteIsGrayscale: boolean = true;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/AvatarDataContainer.as::get paletteIsGrayscale()
    public get paletteIsGrayscale(): boolean
    {
        return this._paletteIsGrayscale;
    }

    private _reds: number[];

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/AvatarDataContainer.as::get reds()
    public get reds(): number[]
    {
        return this._reds;
    }

    private _greens: number[];

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/AvatarDataContainer.as::get greens()
    public get greens(): number[]
    {
        return this._greens;
    }

    private _blues: number[];

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/AvatarDataContainer.as::get blues()
    public get blues(): number[]
    {
        return this._blues;
    }

    private _alphas: number[];

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/AvatarDataContainer.as::get alphas()
    public get alphas(): number[]
    {
        return this._alphas;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/AvatarDataContainer.as::generatePaletteMapForGrayscale()
    private generatePaletteMapForGrayscale(bgColor: number, fgColor: number): {
        reds: number[];
        greens: number[];
        blues: number[];
        alphas: number[]
    }
    {
        // AS3 (AvatarDataContainer.as:99-133) extracts an alpha channel too (>> 24) and
        // walks an alpha accumulator alongside r/g/b, packing it into bits 24-31. The port
        // dropped it, so every palette entry had alpha 0. For 6-hex effect colours the
        // alpha stays 0 either way (getImage keeps the source alpha), but 8-hex colours
        // (ARGB) now carry their gradient alpha as AS3 intends.
        const bgA = (bgColor >> 24) & 0xFF;
        const bgR = (bgColor >> 16) & 0xFF;
        const bgG = (bgColor >> 8) & 0xFF;
        const bgB = bgColor & 0xFF;

        const fgA = (fgColor >> 24) & 0xFF;
        const fgR = (fgColor >> 16) & 0xFF;
        const fgG = (fgColor >> 8) & 0xFF;
        const fgB = fgColor & 0xFF;

        const aStep = (fgA - bgA) / 255;
        const rStep = (fgR - bgR) / 255;
        const gStep = (fgG - bgG) / 255;
        const bStep = (fgB - bgB) / 255;

        const reds: number[] = [];
        const greens: number[] = [];
        const blues: number[] = [];
        const alphas: number[] = [];

        let curA = bgA;
        let curR = bgR;
        let curG = bgG;
        let curB = bgB;

        for(let i = 0; i < 256; i++)
        {
            // AS3 resets the accumulator to 0 on the first step (while cur still equals bg).
            if(curR === bgR && curG === bgG && curB === bgB) curA = 0;

            curA += aStep;
            curR += rStep;
            curG += gStep;
            curB += bStep;

            const value = ((curA & 0xFF) << 24) | ((curR & 0xFF) << 16) | ((curG & 0xFF) << 8) | (curB & 0xFF);

            reds.push(value);
            greens.push(value);
            blues.push(value);
            alphas.push(value);
        }

        return {reds, greens, blues, alphas};
    }
}
