/**
 * GraphicAssetPalette
 *
 * @see com.sulake.room.object.visualization.utils.GraphicAssetPalette
 *
 * Palette-based colorization for graphic assets.
 * In Flash this uses BitmapData.paletteMap(); here we use canvas pixel manipulation.
 */
export class GraphicAssetPalette
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/object/visualization/utils/GraphicAssetPalette.as::_palette
    private _palette: number[] = [];

    constructor(data: Uint8Array, primaryColor: number, secondaryColor: number)
    {
        let offset = 0;

        while(offset + 2 < data.length)
        {
            const r = data[offset++];
            const g = data[offset++];
            const b = data[offset++];
            const color = (0xFF000000 | (r << 16) | (g << 8) | b) >>> 0;

            this._palette.push(color);
        }

        while(this._palette.length < 256)
        {
            this._palette.push(0);
        }

        this._primaryColor = primaryColor;
        this._secondaryColor = secondaryColor;
    }

    // AS3: .../src/com/sulake/room/object/visualization/utils/GraphicAssetPalette.as::_primaryColor
    private _primaryColor: number = 0;

    // AS3: .../src/com/sulake/room/object/visualization/utils/GraphicAssetPalette.as::get primaryColor()
    get primaryColor(): number
    {
        return this._primaryColor;
    }

    // AS3: .../src/com/sulake/room/object/visualization/utils/GraphicAssetPalette.as::_secondaryColor
    private _secondaryColor: number = 0;

    // AS3: .../src/com/sulake/room/object/visualization/utils/GraphicAssetPalette.as::get secondaryColor()
    get secondaryColor(): number
    {
        return this._secondaryColor;
    }

    /**
	 * Apply palette colorization to canvas image data.
	 * Maps green channel values to palette colors while preserving alpha.
	 *
	 * @see AS3 BitmapData.paletteMap() — uses green channel as index
	 */
    colorizePixels(imageData: ImageData): void
    {
        const data = imageData.data;

        for(let i = 0; i < data.length; i += 4)
        {
            const greenIndex = data[i + 1];
            const paletteColor = this._palette[greenIndex] || 0;

            data[i] = (paletteColor >> 16) & 0xFF;     // R
            data[i + 1] = (paletteColor >> 8) & 0xFF;  // G
            data[i + 2] = paletteColor & 0xFF;          // B
            // Alpha (data[i + 3]) preserved from original
        }
    }

    // AS3: .../src/com/sulake/room/object/visualization/utils/GraphicAssetPalette.as::dispose()
    dispose(): void
    {
        this._palette = [];
    }
}
