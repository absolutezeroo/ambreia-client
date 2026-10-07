/**
 * Anything the wardrobe can save: a figure and the gender it was built for.
 *
 * Implemented by `WardrobeSlot` and `Outfit`, and taken by
 * `AvatarEditorMessageHandler.saveWardrobeOutfit()`.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/IOutfit.as
 */
export interface IOutfit
{
    // AS3: .../avatar/IOutfit.as::get figure()
    readonly figure: string;

    // AS3: .../avatar/IOutfit.as::get gender()
    readonly gender: string;
}
