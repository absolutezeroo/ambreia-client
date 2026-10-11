import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';

/**
 * A panel beside the editor's pages rather than one of them — the wardrobe is the only one.
 *
 * `HabboAvatarEditor` keeps these in a map separate from its categories, and shows them only when
 * `isSideContentEnabled()` is on.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/common/ISideContentModel.as
 */
export interface ISideContentModel
{
    // AS3: .../avatar/common/ISideContentModel.as::dispose()
    dispose(): void;

    // AS3: .../avatar/common/ISideContentModel.as::reset()
    reset(): void;

    // AS3: .../avatar/common/ISideContentModel.as::getWindowContainer()
    getWindowContainer(): IWindowContainer | null;
}

/**
 * The window side of a side panel. Two members — it has no `init`/`reset` pair of its own, unlike
 * `ICategoryView`, because the model drives it.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/common/ISideContentView.as
 */
export interface ISideContentView
{
    // AS3: .../avatar/common/ISideContentView.as::dispose()
    dispose(): void;

    // AS3: .../avatar/common/ISideContentView.as::getWindowContainer()
    getWindowContainer(): IWindowContainer | null;
}
