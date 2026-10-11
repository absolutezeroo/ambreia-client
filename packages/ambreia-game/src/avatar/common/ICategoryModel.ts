import type {IWindow} from '@ambreia/ui/IWindow';
import type {ICategoryModelOwner} from './ICategoryModelOwner';
import type {IFigureSetOwnership} from './IFigureSetOwnership';
import type {IAvatarEditorGridModel} from './IAvatarEditorGridModel';

/**
 * One page of the avatar editor — body, head, torso, legs, misc, hot looks or effects.
 *
 * Interface name DERIVED: the AS3 file is `_SafeCls_2660.as` and the identifier exists in no tree.
 * Named for its sole implementor, `CategoryBaseModel`, and for `HabboAvatarEditor`'s `_categories`
 * map, which holds nothing else.
 *
 * A "category" here is a whole page, and each page owns several *part types* — the torso page
 * edits `ch`, `cc`, `ca` and `cp` — which is why every method below is keyed by part type rather
 * than by the page.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/common/_SafeCls_2660.as
 */
export interface ICategoryModel extends IAvatarEditorGridModel
{
    // AS3: .../avatar/common/_SafeCls_2660.as::dispose()
    dispose(): void;

    // AS3: .../avatar/common/_SafeCls_2660.as::reset()
    reset(): void;

    // AS3: .../avatar/common/_SafeCls_2660.as::get controller()
    // AS3 types this `HabboAvatarEditor`; narrowed to the surface the pages and their views use.
    readonly controller: ICategoryModelOwner | null;

    // AS3: .../avatar/common/_SafeCls_2660.as::getWindowContainer()
    getWindowContainer(): IWindow | null;

    // AS3: .../avatar/common/_SafeCls_2660.as::switchCategory()
    switchCategory(partType?: string): void;

    // AS3: .../avatar/common/_SafeCls_2660.as::hasClubItemsOverLevel()
    hasClubItemsOverLevel(clubLevel: number): boolean;

    // AS3: .../avatar/common/_SafeCls_2660.as::hasInvalidSellableItems()
    hasInvalidSellableItems(inventory: IFigureSetOwnership | null): boolean;

    // AS3: .../avatar/common/_SafeCls_2660.as::stripClubItemsOverLevel()
    stripClubItemsOverLevel(clubLevel: number): boolean;

    // AS3: .../avatar/common/_SafeCls_2660.as::stripInvalidSellableItems()
    stripInvalidSellableItems(): boolean;
}
