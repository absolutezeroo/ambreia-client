import type {IOutfit} from './IOutfit';

/**
 * The three requests the editor sends through its message handler.
 *
 * TS-only as an interface: AS3 has only the concrete `AvatarEditorMessageHandler`, which the
 * editor reaches as `manager.handler`. Extracted so `IHabboAvatarEditorHost` stays free of the
 * concrete class.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/AvatarEditorMessageHandler.as
 */
export interface IAvatarEditorMessageHandler
{
    // AS3: .../avatar/AvatarEditorMessageHandler.as::saveWardrobeOutfit()
    saveWardrobeOutfit(slotId: number, outfit: IOutfit): void;

    // AS3: .../avatar/AvatarEditorMessageHandler.as::getWardrobe()
    getWardrobe(): void;

    // AS3: .../avatar/AvatarEditorMessageHandler.as::checkName()
    checkName(name: string): void;

    // AS3: .../avatar/AvatarEditorMessageHandler.as::dispose()
    dispose(): void;
}
