/**
 * FurnitureRoomBrandingLogic
 *
 * @see source_as_win63/habbo/room/object/logic/furniture/FurnitureRoomBrandingLogic.as
 *
 * Logic for room branding furniture (custom image, offset, click URL).
 */
import type {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';
import type {IRoomGeometry} from '../../utils/IRoomGeometry';
import type {RoomSpriteMouseEvent} from '../../events/RoomSpriteMouseEvent';
import {FurnitureLogic} from './FurnitureLogic';
import {RoomObjectRoomAdEvent} from '../../scene/events/RoomObjectRoomAdEvent';
import type {RoomObjectRoomAdUpdateMessage} from '../../scene/messages/RoomObjectRoomAdUpdateMessage';

export class FurnitureRoomBrandingLogic extends FurnitureLogic
{
    // AS3: .../src/com/sulake/habbo/room/object/logic/furniture/FurnitureRoomBrandingLogic.as::STUFF_DATA_KEY_STATE
    public static readonly STUFF_DATA_KEY_STATE = 'state';
    // AS3: .../src/com/sulake/habbo/room/object/logic/furniture/FurnitureRoomBrandingLogic.as::STUFF_DATA_KEY_IMAGEURL
    public static readonly STUFF_DATA_KEY_IMAGEURL = 'imageUrl';
    // AS3: .../src/com/sulake/habbo/room/object/logic/furniture/FurnitureRoomBrandingLogic.as::STUFF_DATA_KEY_CLICKURL
    public static readonly STUFF_DATA_KEY_CLICKURL = 'clickUrl';
    // AS3: .../src/com/sulake/habbo/room/object/logic/furniture/FurnitureRoomBrandingLogic.as::STUFF_DATA_KEY_OFFSET_X
    public static readonly STUFF_DATA_KEY_OFFSET_X = 'offsetX';
    // AS3: .../src/com/sulake/habbo/room/object/logic/furniture/FurnitureRoomBrandingLogic.as::STUFF_DATA_KEY_OFFSET_Y
    public static readonly STUFF_DATA_KEY_OFFSET_Y = 'offsetY';
    // AS3: .../src/com/sulake/habbo/room/object/logic/furniture/FurnitureRoomBrandingLogic.as::STUFF_DATA_KEY_OFFSET_Z
    public static readonly STUFF_DATA_KEY_OFFSET_Z = 'offsetZ';

    protected _disableSelection: boolean = true;
    protected _hasClickUrl: boolean = false;

    override initialize(data: unknown): void
    {
        super.initialize(data);

        if(this._disableSelection)
        {
            this.object?.getModelController()?.setNumber('furniture_selection_disable', 1);
        }
    }

    override getEventTypes(): string[]
    {
        const types = [
            'RORAE_ROOM_AD_LOAD_IMAGE'
        ];

        return this.getAllEventTypes(super.getEventTypes(), types);
    }

    override processUpdateMessage(message: RoomObjectUpdateMessage): void
    {
        super.processUpdateMessage(message);

        if('state' in message && 'data' in message)
        {
            this.setupImageFromFurnitureData();
        }

        const adMessage = message as unknown as RoomObjectRoomAdUpdateMessage;
        if('asset' in message && 'bitmapData' in message)
        {
            switch(adMessage.type)
            {
                case 'RORUM_ROOM_BILLBOARD_IMAGE_LOADED':
                    this.object?.getModelController()?.setNumber('furniture_branding_image_status', 1, false);
                    break;
                case 'RORUM_ROOM_BILLBOARD_IMAGE_LOADING_FAILED':
                    this.object?.getModelController()?.setNumber('furniture_branding_image_status', -1);
                    break;
            }
        }
    }

    override mouseEvent(event: RoomSpriteMouseEvent, geometry: IRoomGeometry): void
    {
        if(event === null || geometry === null)
        {
            return;
        }

        if(event.type === 'mouseMove')
        {
            return;
        }

        if(event.type !== 'doubleClick')
        {
            super.mouseEvent(event, geometry);
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/logic/furniture/FurnitureRoomBrandingLogic.as::setupImageFromFurnitureData()
    private setupImageFromFurnitureData(): boolean
    {
        if(this.object === null)
        {
            return false;
        }

        const model = this.object.getModelController();
        if(model === null)
        {
            return false;
        }

        let changed = false;

        const stuffDataStr = model.getString('furniture_data');
        if(stuffDataStr === null)
        {
            return false;
        }

        // Parse MapStuffData from model
        const imageUrl = this.forceImageUrlToUseHttps(model.getString('stuffdata_val_imageUrl'));
        const clickUrl = model.getString('stuffdata_val_clickUrl');

        if(imageUrl !== null)
        {
            const currentUrl = model.getString('furniture_branding_image_url');

            if(currentUrl === null || this.forceImageUrlToUseHttps(currentUrl) !== imageUrl)
            {
                model.setString('furniture_branding_image_url', imageUrl, false);
                model.setNumber('furniture_branding_image_status', 0, false);
                changed = true;
            }
        }

        if(clickUrl !== null)
        {
            const currentClickUrl = model.getString('furniture_branding_url');

            if(currentClickUrl === null || currentClickUrl !== clickUrl)
            {
                model.setString('furniture_branding_url', clickUrl);
                changed = true;
            }
        }

        const offsetX = model.getString('stuffdata_val_offsetX');
        const offsetY = model.getString('stuffdata_val_offsetY');
        const offsetZ = model.getString('stuffdata_val_offsetZ');

        if(offsetX !== null && !isNaN(parseInt(offsetX)))
        {
            changed = this.updateOffset('furniture_branding_offset_x', model.getNumber('furniture_branding_offset_x'), parseInt(offsetX)) || changed;
        }

        if(offsetY !== null && !isNaN(parseInt(offsetY)))
        {
            changed = this.updateOffset('furniture_branding_offset_y', model.getNumber('furniture_branding_offset_y'), parseInt(offsetY)) || changed;
        }

        if(offsetZ !== null && !isNaN(parseInt(offsetZ)))
        {
            changed = this.updateOffset('furniture_branding_offset_z', model.getNumber('furniture_branding_offset_z'), parseInt(offsetZ)) || changed;
        }

        const finalImageUrl = model.getString('furniture_branding_image_url');
        const finalClickUrl = model.getString('furniture_branding_url');

        if(finalImageUrl !== null && this.eventDispatcher !== null)
        {
            this.eventDispatcher.emit(
                'RORAE_ROOM_AD_LOAD_IMAGE',
                new RoomObjectRoomAdEvent('RORAE_ROOM_AD_LOAD_IMAGE', this.object, finalImageUrl, finalClickUrl)
            );
        }

        let extraParam = 'imageUrl=' + (finalImageUrl ?? '') + '\t';

        if(this._hasClickUrl)
        {
            extraParam += 'clickUrl=' + (finalClickUrl ?? '') + '\t';
        }

        const ox = model.getNumber('furniture_branding_offset_x') ?? 0;
        const oy = model.getNumber('furniture_branding_offset_y') ?? 0;
        const oz = model.getNumber('furniture_branding_offset_z') ?? 0;

        extraParam += 'offsetX=' + ox + '\t';
        extraParam += 'offsetY=' + oy + '\t';
        extraParam += 'offsetZ=' + oz + '\t';

        model.setString('RWEIEP_INFOSTAND_EXTRA_PARAM', 'RWEIEP_BRANDING_OPTIONS' + extraParam);

        return changed;
    }

    // AS3: .../src/com/sulake/habbo/room/object/logic/furniture/FurnitureRoomBrandingLogic.as::forceImageUrlToUseHttps()
    private forceImageUrlToUseHttps(url: string | null): string | null
    {
        return url !== null ? url.replace('http:', 'https:') : null;
    }

    // AS3: .../src/com/sulake/habbo/room/object/logic/furniture/FurnitureRoomBrandingLogic.as::updateOffset()
    private updateOffset(key: string, current: number, next: number): boolean
    {
        if(!isNaN(next) && current !== next)
        {
            this.object?.getModelController()?.setNumber(key, next);
            return true;
        }

        return false;
    }
}
