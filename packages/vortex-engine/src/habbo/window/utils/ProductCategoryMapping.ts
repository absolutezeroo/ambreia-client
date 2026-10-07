/**
 * Maps a furniture data category letter + class ID to a product-preview
 * category bucket, used by ProductIconWidget/ProductImageWidget to decide
 * whether a wall item can be previewed at all.
 *
 * AS3 class name unrecoverable: obfuscated as `_SafeCls_4273` in
 * WIN63-202607011411-782849652 and `class_3988` in win63_version - neither tier
 * nor PRODUCTION-201601012205-226667486 has a readable name for this utility class.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/_SafeCls_4273.as::categoryMapping()
 */
import type {IHabboWindowManager} from '@habbo/window/IHabboWindowManager';

export class ProductCategoryMapping 
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/_SafeCls_4273.as::categoryMapping()
    public static categoryMapping(category: string, classId: number): number 
    {
        if(category === 'S') 
        {
            return 1;
        }

        if(category === 'I') 
        {
            if(classId === 3001) return 2;
            if(classId === 3002) return 3;
            if(classId === 4057) return 4;

            return 1;
        }

        return 1;
    }

    /**
     * A chat bubble in one style, rendered with the player's own name as its text — the swatch a
     * chat-style product shows in the catalog and the inventory.
     *
     * The name defaults to the player's, which is what makes the preview read as "this is what
     * *you* would look like saying something".
     */
    // DEVIATION: AS3 renders the bubble through the free-flow chat, which left with the core cut
    //   (2026-10-07); there is no chat style to preview, so the answer is always null.
    // AS3: .../src/com/sulake/habbo/window/utils/_SafeCls_4273.as::createChatItemPreview()
    public static createChatItemPreview(
        _windowManager: IHabboWindowManager | null,
        _styleId: number,
        _username: string | null = null
    ): ImageBitmap | null
    {
        return null;
    }
}
