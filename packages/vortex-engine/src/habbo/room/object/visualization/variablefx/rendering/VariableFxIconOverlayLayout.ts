import {VariableFxIconOverlayPlacement} from './VariableFxIconOverlayPlacement';

/** What `VariableFxIconOverlayLayout.resolve()` needs to lay a bar and its icons out. */
export interface IVariableFxIconOverlayRequest
{
    alignment: string | null;
    contentWidth: number;
    contentHeight: number;
    contentYOffsetPx: number | null;
    iconWidth: number;
    iconHeight: number;
    iconOffsetX: number | null;
    iconOffsetY: number | null;
    overlapPx: number;
}

/**
 * Fits a bar and the icon(s) hanging off it into one frame, and says where each part lands.
 *
 * The icon overlaps the bar by `overlapPx` rather than sitting beside it, so the frame is narrower
 * than icon + bar. Everything else here is the consequence of that: the content may have to shift
 * right to make room, the taller of the two centres against the other, and an icon whose own offset
 * pushes it off the top-left drags the WHOLE layout back into positive coordinates — that is what
 * the two shift terms do, and without them a nudged icon would be silently cropped by the frame
 * edge.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/rendering/VariableFxIconOverlayLayout.as
 */
export class VariableFxIconOverlayLayout
{
    /** Where the bar itself sits inside the frame. */
    // AS3: .../variablefx/rendering/VariableFxIconOverlayLayout.as::contentX
    //   Name derived: the AS3 field is `_SafeStr_4806`; it is what `frameWidth` adds `contentWidth`
    //   to, and what the renderers draw the bar at.
    contentX: number = 0;

    // AS3: .../variablefx/rendering/VariableFxIconOverlayLayout.as::contentY
    //   Name derived — the vertical twin of contentX.
    contentY: number = 0;

    // AS3: .../variablefx/rendering/VariableFxIconOverlayLayout.as::frameWidth
    frameWidth: number = 0;

    // AS3: .../variablefx/rendering/VariableFxIconOverlayLayout.as::frameHeight
    frameHeight: number = 0;

    // AS3: .../variablefx/rendering/VariableFxIconOverlayLayout.as::hasIcon
    hasIcon: boolean = false;

    // AS3: .../variablefx/rendering/VariableFxIconOverlayLayout.as::iconPlacements
    //   Name derived: the AS3 field is `_SafeStr_6582`, the array of
    //   VariableFxIconOverlayPlacement this builds.
    iconPlacements: VariableFxIconOverlayPlacement[] = [];

    /** The first placement, repeated as a pair for the common single-icon case. */
    // AS3: .../variablefx/rendering/VariableFxIconOverlayLayout.as::iconX
    //   Name derived: the AS3 field is `_SafeStr_7606`, assigned `iconPlacements[0].x`.
    iconX: number = 0;

    // AS3: .../variablefx/rendering/VariableFxIconOverlayLayout.as::iconY
    //   Name derived: `_SafeStr_7665`, assigned `iconPlacements[0].y`.
    iconY: number = 0;

    // AS3: .../variablefx/rendering/VariableFxIconOverlayLayout.as::resolve()
    static resolve(request: IVariableFxIconOverlayRequest): VariableFxIconOverlayLayout
    {
        const layout = new VariableFxIconOverlayLayout();

        const contentWidth = Math.max(0, request.contentWidth | 0);
        const contentHeight = Math.max(0, request.contentHeight | 0);
        const iconWidth = Math.max(0, request.iconWidth | 0);
        const iconHeight = Math.max(0, request.iconHeight | 0);
        const overlapPx = request.overlapPx | 0;
        const contentYOffsetPx = (request.contentYOffsetPx ?? 0) | 0;
        const iconOffsetX = (request.iconOffsetX ?? 0) | 0;
        const iconOffsetY = (request.iconOffsetY ?? 0) | 0;
        const alignment = request.alignment ?? 'left';

        layout.hasIcon = iconWidth > 0 && iconHeight > 0;

        // No icon: the frame IS the bar.
        if(!layout.hasIcon)
        {
            layout.contentX = 0;
            layout.contentY = 0;
            layout.frameHeight = contentHeight;
            layout.frameWidth = contentWidth;
            layout.iconX = 0;
            layout.iconY = 0;

            return layout;
        }

        // How far the icon sticks out past the overlap, and therefore how far the bar must move.
        // A right-aligned icon sticks out the other end, so the bar does not move at all.
        const iconProtrusion = Math.max(0, iconWidth - overlapPx);
        const contentX = alignment === 'right' ? 0 : iconProtrusion;

        const rowHeight = Math.max(contentHeight, iconHeight);
        const contentY = Math.max(0, ((rowHeight - contentHeight) / 2 | 0) + contentYOffsetPx);
        const iconY = ((rowHeight - iconHeight) / 2 | 0) + iconOffsetY;

        const placements = VariableFxIconOverlayLayout.resolveDefaultIconPlacements(
            alignment, contentX, contentWidth, iconOffsetX, iconY, overlapPx
        );

        // Drag everything back into positive coordinates if the icon's own offset pushed any part
        // of the layout off the top or left.
        const shiftX = Math.max(0, -Math.min(contentX, VariableFxIconOverlayLayout.minPlacementX(placements)));
        const shiftY = Math.max(0, -Math.min(contentY, VariableFxIconOverlayLayout.minPlacementY(placements)));

        layout.contentX = contentX + shiftX;
        layout.contentY = contentY + shiftY;

        for(const placement of placements)
        {
            layout.iconPlacements.push(new VariableFxIconOverlayPlacement(placement.x + shiftX, placement.y + shiftY));
        }

        const first = layout.iconPlacements[0]!;

        layout.iconX = first.x;
        layout.iconY = first.y;

        layout.frameHeight = Math.max(
            layout.contentY + contentHeight,
            VariableFxIconOverlayLayout.maxPlacementBottom(layout.iconPlacements, iconHeight)
        );
        layout.frameWidth = Math.max(
            layout.contentX + contentWidth,
            VariableFxIconOverlayLayout.maxPlacementRight(layout.iconPlacements, iconWidth)
        );

        return layout;
    }

    // AS3: .../variablefx/rendering/VariableFxIconOverlayLayout.as::resolveDefaultIconPlacements()
    private static resolveDefaultIconPlacements(
        alignment: string,
        contentX: number,
        contentWidth: number,
        iconOffsetX: number,
        iconY: number,
        overlapPx: number
    ): VariableFxIconOverlayPlacement[]
    {
        const left = new VariableFxIconOverlayPlacement(iconOffsetX, iconY);
        const right = new VariableFxIconOverlayPlacement(contentX + contentWidth - overlapPx - iconOffsetX, iconY);

        switch(alignment)
        {
            case 'right':
                return [right];
            case 'double':
                return [left, right];
            default:
                return [left];
        }
    }

    // AS3: .../variablefx/rendering/VariableFxIconOverlayLayout.as::minPlacementX()
    private static minPlacementX(placements: VariableFxIconOverlayPlacement[]): number
    {
        if(placements.length === 0) return 0;

        return Math.min(...placements.map((placement) => placement.x));
    }

    // AS3: .../variablefx/rendering/VariableFxIconOverlayLayout.as::minPlacementY()
    private static minPlacementY(placements: VariableFxIconOverlayPlacement[]): number
    {
        if(placements.length === 0) return 0;

        return Math.min(...placements.map((placement) => placement.y));
    }

    // AS3: .../variablefx/rendering/VariableFxIconOverlayLayout.as::maxPlacementBottom()
    private static maxPlacementBottom(placements: VariableFxIconOverlayPlacement[], iconHeight: number): number
    {
        let bottom = 0;

        for(const placement of placements) bottom = Math.max(bottom, placement.y + iconHeight);

        return bottom;
    }

    // AS3: .../variablefx/rendering/VariableFxIconOverlayLayout.as::maxPlacementRight()
    private static maxPlacementRight(placements: VariableFxIconOverlayPlacement[], iconWidth: number): number
    {
        let right = 0;

        for(const placement of placements) right = Math.max(right, placement.x + iconWidth);

        return right;
    }
}
