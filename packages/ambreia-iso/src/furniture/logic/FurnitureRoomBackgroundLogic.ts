/**
 * FurnitureRoomBackgroundLogic
 *
 * @see source_as_win63/habbo/room/object/logic/furniture/FurnitureRoomBackgroundLogic.as
 *
 * Logic for room background furniture (branding without click URL).
 */
import {FurnitureRoomBrandingLogic} from './FurnitureRoomBrandingLogic';

export class FurnitureRoomBackgroundLogic extends FurnitureRoomBrandingLogic
{
    protected override getAdClickUrl(_model: { getString(key: string): string | null }): string | null
    {
        return null;
    }
}
