import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IPartColor} from '@ambreia/avatar/structure/figure/IPartColor';
import type {IFigurePartSet} from '@ambreia/avatar/structure/figure/IFigurePartSet';

/**
 * One clothing thumbnail in a category's grid, as `CategoryData` sees it.
 *
 * TS-only: AS3's `CategoryData` holds concrete `AvatarEditorGridPartItem`s, which are window-backed
 * (514 l., a thumbnail with its own rendered avatar). It touches only the six members below.
 * Extracted so the selection model ports and verifies before the view layer exists;
 * `AvatarEditorGridPartItem` will satisfy this as written.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/common/AvatarEditorGridPartItem.as
 */
export interface IAvatarEditorGridPartItem
{
    // AS3: .../avatar/common/AvatarEditorGridPartItem.as::get view()
    // The cloned thumbnail window. What `AvatarEditorGridView` actually puts in the grid.
    readonly view: IWindowContainer | null;

    // AS3: .../avatar/common/AvatarEditorGridPartItem.as::get id()
    readonly id: number;

    // AS3: .../avatar/common/AvatarEditorGridPartItem.as::get partSet()
    // Null for the two synthetic thumbnails, "REMOVE_ITEM" and "GET_MORE" — which is why every
    // caller in `CategoryData` null-checks it before reading `clubLevel` or `isSellable`.
    readonly partSet: IFigurePartSet | null;

    // AS3: .../avatar/common/AvatarEditorGridPartItem.as::get colorLayerCount()
    // How many of the selected colours this part actually wears; `getSelectedColorIds()` slices
    // its answer to this, floored at 1.
    readonly colorLayerCount: number;

    // AS3: .../avatar/common/AvatarEditorGridPartItem.as::set isSelected()
    isSelected: boolean;

    // AS3: .../avatar/common/AvatarEditorGridPartItem.as::get isDisabledForWearing()
    // True for a club item the user cannot afford, shown dimmed rather than hidden when
    // `avatareditor.show.clubitems.dimmed` is on. Clicking one reverts the selection and opens the
    // club advert instead.
    readonly isDisabledForWearing: boolean;

    // AS3: .../avatar/common/AvatarEditorGridPartItem.as::set iconImage()
    // The thumbnail's picture. Written by `HabboAvatarEditor` for the two synthetic entries and,
    // for the face grid, by `BodyModel` with a rendered head per candidate face.
    iconImage: ImageBitmap | null;

    // AS3: .../avatar/common/AvatarEditorGridPartItem.as::set colors()
    // Write-only from `CategoryData`'s side — it pushes the palette selection into every thumbnail
    // so each redraws itself in the chosen colours.
    colors: (IPartColor | null)[];

    // AS3: .../avatar/common/AvatarEditorGridPartItem.as::dispose()
    dispose(): void;
}

/**
 * One colour swatch in a category's palette, as `CategoryData` sees it.
 *
 * TS-only: the same narrowing as `IAvatarEditorGridPartItem` — AS3's concrete
 * `AvatarEditorGridColorItem` is window-backed (145 l.) and only these three members are read here.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/common/AvatarEditorGridColorItem.as
 */
export interface IAvatarEditorGridColorItem
{
    // AS3: .../avatar/common/AvatarEditorGridColorItem.as::get view()
    // The cloned swatch window, added to one of the two palette grids.
    readonly view: IWindowContainer | null;

    // AS3: .../avatar/common/AvatarEditorGridColorItem.as::get partColor()
    readonly partColor: IPartColor | null;

    // AS3: .../avatar/common/AvatarEditorGridColorItem.as::set isSelected()
    isSelected: boolean;

    // AS3: .../avatar/common/AvatarEditorGridColorItem.as::get isDisabledForWearing()
    // The colour equivalent of the part flag above — same dimmed-club-item treatment.
    readonly isDisabledForWearing: boolean;

    // AS3: .../avatar/common/AvatarEditorGridColorItem.as::dispose()
    dispose(): void;
}
