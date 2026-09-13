/**
 * How a VariableFx renderer reaches the artwork and the configuration it draws from.
 *
 * An interface rather than a direct asset-library call because the wired editor's preview builds
 * its own provider over unsaved settings, and the renderers must not know which one they have.
 *
 * `ImageBitmap` where AS3 says `BitmapData`: the renderers composite pixels onto a canvas, and
 * `drawImage()` takes an ImageBitmap. Handing back the asset library's PixiJS `Texture` instead
 * type-checks and then throws at the first draw — see `AssetBitmap`, which exists for exactly that
 * trap and aborts a whole render pass when it is sprung.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/_SafeCls_1791.as
 */
export interface IVariableFxAssetProvider
{
    // AS3: .../visualization/variablefx/_SafeCls_1791.as::getBitmapData()
    getBitmapData(name: string): ImageBitmap | null;

    // AS3: .../visualization/variablefx/_SafeCls_1791.as::getXml()
    getXml(name: string): Document | null;
}
