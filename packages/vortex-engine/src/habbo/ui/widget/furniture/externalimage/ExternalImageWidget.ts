import type {Component} from '@core/runtime';
import type {IWindow} from '@core/window/IWindow';
import {SelectableTextOverlay} from '@core/window/utils/SelectableTextOverlay';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IAssetLibrary} from '@core/assets/IAssetLibrary';
import type {IBitmapWrapperWindow} from '@core/window/components/IBitmapWrapperWindow';
import type {IDisplayObjectWrapper} from '@core/window/components/IDisplayObjectWrapper';
import type {IHTMLTextWindow} from '@core/window/components/IHTMLTextWindow';
import type {ILabelWindow} from '@core/window/components/ILabelWindow';
import type {IRegionWindow} from '@core/window/components/IRegionWindow';
import type {ITextWindow} from '@core/window/components/ITextWindow';
import type {ITextFieldWindow} from '@core/window/components/ITextFieldWindow';
import type {WindowEvent} from '@core/window/events/WindowEvent';
import type {WindowLinkEvent} from '@core/window/events/WindowLinkEvent';
import type {IHabboHelp} from '@habbo/help/IHabboHelp';
import type {IHabboInventory} from '@habbo/inventory/IHabboInventory';
import type {IHabboLocalizationManager} from '@habbo/localization/IHabboLocalizationManager';
import type {IHabboWindowManager} from '@habbo/window/IHabboWindowManager';
import type {IRoomEngine} from '@habbo/room/IRoomEngine';
import type {IRoomObject} from '@room/object/IRoomObject';
import type {IRoomWidgetHandler} from '../../../IRoomWidgetHandler';
import type {ExternalImageWidgetHandler} from '../../../handler/ExternalImageWidgetHandler';
import {RoomWidgetBase} from '../../RoomWidgetBase';
import {RoomObjectCategoryEnum} from '@habbo/room/object/RoomObjectCategoryEnum';
import {RoomObjectVariableEnum} from '@habbo/room/object/RoomObjectVariableEnum';
import {GetExtendedProfileMessageComposer} from '@habbo/communication/messages/outgoing/users/GetExtendedProfileMessageComposer';
import {AlertDialogCaption} from '@habbo/window/utils/AlertDialogCaption';
import {HabboWebTools} from '@habbo/utils/HabboWebTools';
import {StringUtil} from '@habbo/utils/StringUtil';
import {Logger} from '@core/utils/Logger';

const log = Logger.getLogger('habbo.ui.widget.furniture.externalimage.ExternalImageWidget');

/**
 * The photo / selfie wall item, shown full size with its caption, its photographer and — for
 * whoever may remove it — a delete button.
 *
 * Two things make it unlike the other furni widgets. It is a **browser**: the next/previous
 * buttons walk every wall item of the same type in the room, so one click opens the whole album.
 * And its content is not in the furni at all — `readFurniJson()` finds either an inline photo
 * blob or an `id`, and an id means a second, unauthenticated HTTP fetch to the extra-data
 * service, whose 403 is the signal that the photo was moderated away.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/furniture/externalimage/ExternalImageWidget.as
 */
export class ExternalImageWidget extends RoomWidgetBase
{
    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::TYPE_PHOTO_POSTER
    private static readonly TYPE_PHOTO_POSTER: string = 'photo_poster';

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::TYPE_SELFIE
    // Declared and compared against by nothing — `getType()` returns it, and every caller only
    // ever tests for TYPE_PHOTO_POSTER, so selfie and legacy behave identically.
    private static readonly TYPE_SELFIE: string = 'selfie';

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::TYPE_LEGACY
    private static readonly TYPE_LEGACY: string = 'legacy';

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::HORIZONTAL_ITEM_SPACING
    private static readonly HORIZONTAL_ITEM_SPACING: number = 10;

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::VERTICAL_SPACE
    private static readonly VERTICAL_SPACE: number = 71;

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::FURNI_TYPE_POSTER
    // Name DERIVED: the three wall-item types `getType()` switches on inline.
    private static readonly FURNI_TYPE_POSTER: string = 'external_image_wallitem_poster';

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::FURNI_TYPE_POSTER_SMALL
    private static readonly FURNI_TYPE_POSTER_SMALL: string = 'external_image_wallitem_poster_small';

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::FURNI_TYPE_SELFIE
    private static readonly FURNI_TYPE_SELFIE: string = 'external_image_wallitem';

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::SELFIE_URL_PATH
    // Name DERIVED: the path AS3 prefixes inline when the JSON carries a bare file name rather
    // than an absolute URL. A photo poster gets no path at all.
    private static readonly SELFIE_URL_PATH: string = 'postcards/selfie/';

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::STAFF_CONTROLLER_LEVEL
    // Name DERIVED: the 5 AS3 compares `roomControllerLevel` against inline, which is what gates
    // the copyable-name field.
    private static readonly STAFF_CONTROLLER_LEVEL: number = 5;

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::STAFF_NAME_COLOR
    // Name DERIVED: the colour AS3 assigns that field inline.
    private static readonly STAFF_NAME_COLOR: number = 10061943;

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::MODERATED_HTTP_STATUS
    // Name DERIVED: the 403 AS3 tests for inline — the extra-data service answers it for a photo
    // that has been moderated away.
    private static readonly MODERATED_HTTP_STATUS: number = 403;

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::MIN_SHARE_URL_LENGTH
    // Name DERIVED: the `.length > 4` AS3 uses to reject a share-url template that is present but
    // empty or a stub.
    private static readonly MIN_SHARE_URL_LENGTH: number = 4;

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::SHARE_URL_ID_TOKEN
    private static readonly SHARE_URL_ID_TOKEN: string = '%id%';

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::BORDER_THICKNESS
    // Name DERIVED: the 1px offsets AS3 draws the black silhouette at, and the `- 2` / `+ 2` that
    // reserve room for it around the photo.
    private static readonly BORDER_THICKNESS: number = 1;

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::SCREEN_MARGIN_X
    // Name DERIVED: the 100/200 AS3 subtracts from the stage before deciding whether the photo
    // fits, and the 50 it falls back to.
    private static readonly SCREEN_MARGIN_X: number = 100;

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::SCREEN_MARGIN_Y
    private static readonly SCREEN_MARGIN_Y: number = 200;

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::SCREEN_EDGE_OFFSET
    private static readonly SCREEN_EDGE_OFFSET: number = 50;

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::_window
    private _window: IWindowContainer | null = null;

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::_imageLoaderWindow
    // Name DERIVED (`_SafeStr_4702`): the layout child it is found by is "imageLoader".
    private _imageLoaderWindow: IBitmapWrapperWindow | null = null;

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::_moderationText
    private _moderationText: IHTMLTextWindow | null = null;

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::_makeOwnButton
    // Assigned and nulled, never otherwise read — the click arrives through the window procedure
    // by name. Kept because AS3 keeps it.
    private _makeOwnButton: IWindow | null = null;

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::_closeButton
    // Name DERIVED (`_SafeStr_4987`): found by the layout child name "closebutton".
    private _closeButton: IWindow | null = null;

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::_removeButtonContainer
    // Name DERIVED (`_SafeStr_7351`): found by "removeButtonContainer".
    private _removeButtonContainer: IWindowContainer | null = null;

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::_bgBorder
    private _bgBorder: IWindow | null = null;

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::_buttonContainer
    private _buttonContainer: IWindowContainer | null = null;

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::_shareArea
    private _shareArea: IWindowContainer | null = null;

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::_shareButton
    // Assigned and never read, in AS3 too — and not even nulled in dispose(), unlike its siblings.
    private _shareButton: IWindow | null = null;

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::_senderNameButton
    private _senderNameButton: IRegionWindow | null = null;

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::_senderNameLabel
    // Name DERIVED (`_SafeStr_8160`): found by "senderName".
    private _senderNameLabel: ILabelWindow | null = null;

    /**
     * AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::_staffNameField
     *
     * Name DERIVED (`_SafeStr_6114`). In AS3 this is a bare Flash `TextField` dropped into the
     * layout's `name_copy_wrapper` slot for room controller level 5 only, so staff can select and
     * copy the photographer's name out of a label that is otherwise not selectable.
     *
     * DEVIATION: there is no Flash `TextField` to drop in, and a canvas cannot offer selection at
     *   all — text painted into it is pixels. `SelectableTextOverlay` puts a transparent, read-only
     *   DOM element over the same rectangle instead, which is what makes the same glyphs
     *   selectable: the window still paints them, the overlay only carries the selection. Same
     *   technique as `TextFieldController`'s input bridge, minus the input half. Non-staff are
     *   unaffected either way — the wrapper is never populated for them.
     */
    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::_staffNameField
    private _staffNameField: SelectableTextOverlay = new SelectableTextOverlay();

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::_creationDateLabel
    // Name DERIVED (`_SafeStr_7509`): found by "creationDate".
    private _creationDateLabel: ILabelWindow | null = null;

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::_photo
    // Name DERIVED (`_SafeStr_8256`): the loaded photo, kept only so updateWindowPosition() can
    // measure it. AS3 holds a Bitmap; this port holds the decoded ImageBitmap.
    private _photo: ImageBitmap | null = null;

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::_inventory
    private _inventory: IHabboInventory | null;

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::_objectId
    // Name DERIVED (`_SafeStr_6273`): the room object id, or the inventory item id when the photo
    // was opened straight from the inventory.
    private _objectId: number = 0;

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::_extraDataId
    // Name DERIVED (`_SafeStr_6399`): the `id` key of the furni JSON. Its presence is what makes
    // this an externally-hosted photo rather than an inline one.
    private _extraDataId: string | null = null;

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::_caption
    private _caption: string = '';

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::_creatorId
    // Name DERIVED (`_SafeStr_5658`): the photographer's user id, used for the profile link and
    // for both report paths.
    private _creatorId: number = 0;

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::_shareUrl
    // Name DERIVED (`_SafeStr_5877`): the resolved share url, after %id% substitution.
    private _shareUrl: string | null = null;

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::_reportButtonContainer
    // Name DERIVED (`_SafeStr_8083`): found by "reportButtonContainer".
    private _reportButtonContainer: IWindowContainer | null = null;

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::_furniType
    // Name DERIVED (`_SafeStr_5707`): the wall item's type string, which decides both `getType()`
    // and which siblings the next/previous buttons walk.
    private _furniType: string = '';

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::_unusedBitmapWindow
    // Name DERIVED (`_SafeStr_11415`): declared with the image loader's type and never assigned,
    // read or nulled anywhere in the AS3 class. Kept so the field count matches.
    private _unusedBitmapWindow: IBitmapWrapperWindow | null = null;

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::_habboHelp
    private _habboHelp: IHabboHelp | null;

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::_roomEngine
    private _roomEngine: IRoomEngine | null;

    /**
     * AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::reportWindow
     *
     * The only non-underscored field in the class, and it is **never assigned**: `dispose()`
     * destroys it and `onReportWindowEvent()` reads it, but nothing builds it. The in-widget
     * report dialog was replaced by `IHabboHelp.startPhotoReportingInNewCfhFlow()` (see
     * `openReportImage()`) and its construction was removed without removing the rest. Kept, with
     * its handler, so that the dead half stays visible rather than silently absent.
     */
    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::reportWindow
    private _reportWindow: IWindowContainer | null = null;

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::_currentIndex
    // Name DERIVED (`_SafeStr_5029`): the position of the shown photo within the room's wall
    // items of the same type, which is what next/previous step through.
    private _currentIndex: number = 0;

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::_fromInventory
    // Name DERIVED (`_SafeStr_8010`): true when opened from the inventory, which hides both the
    // browsing arrows and the remove/report buttons.
    private _fromInventory: boolean = false;

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::_roomUI
    // Name DERIVED (`_SafeStr_4617`): typed as the base Component in AS3, and used only for the
    // `spaweb` config flag, the link event, and the stage size.
    private _roomUI: Component | null;

    /**
     * AS3 builds the window, wires every child, and then calls `hide()` — so the widget exists
     * from room entry but is invisible until a photo is clicked.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/furniture/externalimage/ExternalImageWidget.as::ExternalImageWidget()
    constructor(
        handler: IRoomWidgetHandler,
        windowManager: IHabboWindowManager,
        assets: IAssetLibrary | null,
        localizations: IHabboLocalizationManager | null,
        inventory: IHabboInventory | null,
        habboHelp: IHabboHelp | null,
        roomEngine: IRoomEngine | null,
        roomUI: Component | null
    )
    {
        super(handler, windowManager, assets, localizations);

        this._inventory = inventory;
        this._habboHelp = habboHelp;
        this._roomEngine = roomEngine;
        this._roomUI = roomUI;

        this._window = windowManager.buildWidgetLayout('stories_image_widget_xml') as IWindowContainer | null;

        if(this._window === null || this._window === undefined)
        {
            // AS3 would throw out of the constructor here. This runs at room entry, so a throw
            // would take the whole room UI with it.
            log.warn('stories_image_widget_xml did not build — photo wall items cannot be opened');
            this._window = null;

            return;
        }

        const ownHandler = this.ownHandler;

        if(ownHandler !== null) ownHandler.widget = this;

        this._closeButton = this._window.findChildByName('closebutton');
        this._imageLoaderWindow = this._window.findChildByName('imageLoader') as IBitmapWrapperWindow | null;
        this._moderationText = this._window.findChildByName('moderationText') as IHTMLTextWindow | null;
        this._moderationText?.addEventListener('WE_LINK', this.onClickModerationInfoLink);
        this._shareArea = this._window.findChildByName('shareArea') as IWindowContainer | null;
        this._removeButtonContainer = this._window.findChildByName('removeButtonContainer') as IWindowContainer | null;
        this._makeOwnButton = this._window.findChildByName('makeOwnButton');
        this._shareButton = this._window.findChildByName('shareButtonContainer');
        this._bgBorder = this._window.findChildByName('bgBorder');
        this._senderNameButton = this._window.findChildByName('senderNameButton') as IRegionWindow | null;
        this._senderNameLabel = this._window.findChildByName('senderName') as ILabelWindow | null;

        if(ownHandler?.container?.roomSession?.roomControllerLevel === ExternalImageWidget.STAFF_CONTROLLER_LEVEL)
        {
            const wrapper = this._window.findChildByName('name_copy_wrapper') as IDisplayObjectWrapper | null;

            this._staffNameField.textColor = ExternalImageWidget.STAFF_NAME_COLOR;
            this._staffNameField.text = '';
            // Both, and in this order: AS3 hands the TextField to the wrapper so the layout owns
            // its rectangle, and the overlay tracks that same window to sit over it.
            wrapper?.setDisplayObject(this._staffNameField);
            this._staffNameField.attachTo(wrapper as unknown as IWindow | null);
        }

        this._creationDateLabel = this._window.findChildByName('creationDate') as ILabelWindow | null;
        this._buttonContainer = this._window.findChildByName('buttonContainer') as IWindowContainer | null;
        this._reportButtonContainer = this._window.findChildByName('reportButtonContainer') as IWindowContainer | null;

        this._window.procedure = this.onWindowEvent;
        this._window.center();

        if(this._shareArea !== null) this._shareArea.visible = false;

        this.hide();
    }

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::get ownHandler()
    private get ownHandler(): ExternalImageWidgetHandler | null
    {
        return (this._handler as ExternalImageWidgetHandler | null) ?? null;
    }

    /**
     * Opening from the room. The remove button appears for whoever may remove it, and the report
     * button only for a photo poster — a selfie needs `stories.report.selfie.enabled` on top.
     *
     * The index lookup happens **after** `show()`, and only if the object is actually among the
     * room's wall items of its type; an object that is not keeps the previous index, so the next
     * arrow resumes from wherever browsing last was.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/furniture/externalimage/ExternalImageWidget.as::showWithRoomObject()
    showWithRoomObject(object: IRoomObject): void
    {
        this._objectId = object.getId();
        this._furniType = object.getType();
        this._fromInventory = false;

        const ownHandler = this.ownHandler;

        if(this._removeButtonContainer !== null)
        {
            this._removeButtonContainer.visible = ownHandler?.hasRightsToRemove() ?? false;
        }

        if(this._reportButtonContainer !== null)
        {
            this._reportButtonContainer.visible = this.getType() === ExternalImageWidget.TYPE_PHOTO_POSTER
                ? true
                : (ownHandler?.isSelfieReportingEnabled() ?? false);
        }

        this.show(object.getModel().getString(RoomObjectVariableEnum.FURNITURE_DATA));

        const siblings = this.getWallItemsOfCurrentTypeInRoom();
        const index = siblings.indexOf(object);

        if(index !== -1) this._currentIndex = index;
    }

    /**
     * Opening from the inventory, before the photo has ever been placed. There is no room object,
     * so the JSON comes off the inventory item's stuff data instead — and both the remove and the
     * report buttons are hidden, since neither makes sense for an item you own and have not hung.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/furniture/externalimage/ExternalImageWidget.as::showWithFurniID()
    showWithFurniID(itemId: number): void
    {
        const item = this._inventory?.getWallItemById(itemId) ?? null;

        if(item === null) return;

        this._objectId = itemId;
        this._furniType = this._roomEngine?.getWallItemType(item.type) ?? '';
        this._fromInventory = true;

        if(this._removeButtonContainer !== null) this._removeButtonContainer.visible = false;
        if(this._reportButtonContainer !== null) this._reportButtonContainer.visible = false;

        this.show(item.stuffData?.getLegacyString() ?? null);
    }

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::hide()
    // Only hides the window; nothing is torn down, so reopening is free.
    hide(): void
    {
        if(this._window !== null) this._window.visible = false;
    }

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::release()
    override release(): void
    {
        this.hide();

        super.release();
    }

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::dispose()
    // AS3 nulls the fields *before* disposing the window, and destroys the (never-built) report
    // window after super.dispose() rather than before. Both kept.
    override dispose(): void
    {
        if(this._window === null) return;

        this._imageLoaderWindow = null;
        this._closeButton = null;
        this._bgBorder = null;
        this._makeOwnButton = null;
        this._removeButtonContainer = null;
        this._inventory = null;
        this._habboHelp = null;
        this._roomEngine = null;
        this._creatorId = 0;
        this._senderNameButton = null;
        this._buttonContainer = null;
        this._shareArea = null;

        // Before the window goes: the overlay tracks one of its children, and a DOM element left
        // over a window that no longer exists would keep swallowing the pointer where it sat.
        // AS3 nulls its TextField here for the same reason.
        // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::dispose()
        this._staffNameField.dispose();

        this._window.procedure = null;
        this._window.dispose();
        this._window = null;

        this._roomUI = null;

        super.dispose();

        if(this._reportWindow !== null)
        {
            this._reportWindow.dispose();
            this._reportWindow = null;
        }
    }

    /**
     * The single gate on the whole widget: an unset or "disabled" image base switches photos off
     * hotel-wide, and the window is never even cleared.
     */
    // DEVIATION: AS3 always shows `makeOwnButton`, which on a photo poster opens the in-client
    //   camera; the RPG fork removed photos, so the button is hidden for a photo poster (a selfie
    //   still sends you to the web).
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/furniture/externalimage/ExternalImageWidget.as::show()
    private show(furniData: string | null): void
    {
        if(this._makeOwnButton !== null)
        {
            this._makeOwnButton.visible = this.getType() !== ExternalImageWidget.TYPE_PHOTO_POSTER;
        }

        if(this.ownHandler?.storiesImageUrlBase === 'disabled') return;

        this.clearImage();

        if(furniData !== null) this.readFurniJson(furniData);
    }

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::showNext()
    // Wraps around; an empty list leaves the current photo alone rather than blanking it.
    private showNext(): void
    {
        const siblings = this.getWallItemsOfCurrentTypeInRoom();

        if(siblings.length === 0) return;

        this._currentIndex = this._currentIndex + 1;

        if(this._currentIndex > siblings.length - 1) this._currentIndex = 0;

        this.showWithRoomObject(siblings[this._currentIndex]);
    }

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::showPrevious()
    private showPrevious(): void
    {
        const siblings = this.getWallItemsOfCurrentTypeInRoom();

        if(siblings.length === 0) return;

        this._currentIndex = this._currentIndex - 1;

        if(this._currentIndex < 0) this._currentIndex = siblings.length - 1;

        this.showWithRoomObject(siblings[this._currentIndex]);
    }

    /**
     * Every wall item in the room sharing the open photo's exact type — so a small poster does not
     * browse into large ones, and a selfie does not browse into posters at all.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/furniture/externalimage/ExternalImageWidget.as::getWallItemsOfCurrentTypeInRoom()
    private getWallItemsOfCurrentTypeInRoom(): IRoomObject[]
    {
        const result: IRoomObject[] = [];
        const objects = this._roomEngine?.getObjectsByCategory(RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL) ?? [];

        for(const object of objects)
        {
            if(object.getType() === this._furniType) result.push(object);
        }

        return result;
    }

    /**
     * Blanks every field and paints a black rectangle the size of the previous photo, so a slow
     * load shows an empty frame rather than the photo it is replacing.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/furniture/externalimage/ExternalImageWidget.as::clearImage()
    private clearImage(): void
    {
        this._extraDataId = null;
        this._caption = '';

        const captionText = this._window?.findChildByName('captionText') as ITextWindow | null;

        if(captionText !== null && captionText !== undefined) captionText.text = '';

        if(this._senderNameButton !== null) this._senderNameButton.visible = false;

        this._creatorId = 0;

        if(this._senderNameLabel !== null) this._senderNameLabel.caption = '';

        this._staffNameField.text = '';

        if(this._creationDateLabel !== null) this._creationDateLabel.caption = '';

        this._shareUrl = null;

        if(this._moderationText !== null) this._moderationText.visible = false;

        void ExternalImageWidget.TYPE_SELFIE;
        void ExternalImageWidget.TYPE_LEGACY;
        void this._unusedBitmapWindow;

        // AS3 draws an opaque, zero-filled BitmapData of the loader's current size. `drawImage`
        // reads only the dimensions off it, so a null photo with the same size is equivalent —
        // and it avoids allocating a throwaway bitmap on every open.
        this.drawImage(null);
    }

    /**
     * The furni JSON is read **twice** in AS3 — once for the `id`, once more for the whole object
     * when there is none. Kept: a single parse would change nothing observable, but the double
     * parse is also the reason a malformed blob is swallowed silently by the outer catch.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/furniture/externalimage/ExternalImageWidget.as::readFurniJson()
    private readFurniJson(furniData: string): void
    {
        try
        {
            const parsed = JSON.parse(furniData) as Record<string, unknown>;

            this._extraDataId = typeof parsed.id === 'string' ? parsed.id : (parsed.id != null ? String(parsed.id) : null);

            if(this._extraDataId !== null && this._extraDataId !== '')
            {
                this.loadExternalData();

                return;
            }

            this.loadPhoto(furniData, this.getImageUrl(JSON.parse(furniData) as Record<string, unknown>));
        }
        catch
        {
            // AS3's catch is empty too: a furni whose data is not JSON simply shows nothing.
        }
    }

    /**
     * The JSON's url may be absolute or a bare file name. A bare name is resolved under the
     * hotel's image base — through `postcards/selfie/` for a selfie, straight off the base for a
     * photo poster — and given a `.png` extension if it has none.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/furniture/externalimage/ExternalImageWidget.as::getImageUrl()
    private getImageUrl(data: Record<string, unknown>): string
    {
        let url = this.getJsonValue(data, 'w', 'url') ?? '';

        if(url.indexOf('http') !== 0)
        {
            let path = ExternalImageWidget.SELFIE_URL_PATH;

            if(this.getType() === ExternalImageWidget.TYPE_PHOTO_POSTER) path = '';

            if(url.indexOf('.png') === -1) url += '.png';

            url = (this.ownHandler?.storiesImageUrlBase ?? '') + path + url;
        }

        return url;
    }

    /**
     * Fills in the photographer, the date, the share url and the caption, then starts the image
     * download. The single-letter keys are the compact form the furni carries; the long names are
     * what the extra-data service returns, which is why every read goes through `getJsonValue()`.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/furniture/externalimage/ExternalImageWidget.as::loadPhoto()
    private loadPhoto(json: string, imageUrl: string | null): void
    {
        let data: Record<string, unknown>;

        try
        {
            data = JSON.parse(json) as Record<string, unknown>;
        }
        catch
        {
            return;
        }

        if(imageUrl === null || imageUrl === '') imageUrl = this.getImageUrl(data);

        // AS3 uses a BitmapFileLoader here. This port fetches and decodes the same way
        // `ItemPopupCtrl` does for its external image, which yields the ImageBitmap the bitmap
        // window wants directly.
        void this.loadImage(imageUrl);

        const creatorName = this.getJsonValue(data, 'n', 'creator_name');
        const creatorId = this.getJsonValue(data, 's', 'creator_id');
        const uniqueId = this.getJsonValue(data, 'u', 'unique_id');
        const time = this.getJsonValue(data, 't', 'time');
        const date = new Date(Number(time));

        if(creatorName !== null && creatorName !== '')
        {
            if(this._senderNameLabel !== null) this._senderNameLabel.caption = creatorName;
            if(this._senderNameButton !== null) this._senderNameButton.visible = true;

            this._staffNameField.text = creatorName;
            this._creatorId = Math.trunc(Number(creatorId)) || 0;

            if(this._creationDateLabel !== null)
            {
                // AS3's Date.date/month/fullYear — day-of-month, a zero-based month, and the full
                // year, joined with dashes and not zero-padded.
                this._creationDateLabel.caption =
                    `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
            }
        }

        const shareUrlBase = this.ownHandler?.storiesImageShareUrl ?? '';

        if(shareUrlBase !== '' && shareUrlBase.length > ExternalImageWidget.MIN_SHARE_URL_LENGTH)
        {
            const urlField = this._window?.findChildByName('urlField') ?? null;
            const resolved = shareUrlBase.replace(ExternalImageWidget.SHARE_URL_ID_TOKEN, uniqueId ?? '');

            if(urlField !== null) urlField.caption = resolved;

            this._shareUrl = resolved;
        }

        this._caption = this.getJsonValue(data, 'm', 'caption') ?? '';

        if(this._caption !== '')
        {
            const captionText = this._window?.findChildByName('captionText') as ITextWindow | null;

            if(captionText !== null && captionText !== undefined) captionText.text = this._caption;
        }
    }

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::getJsonValue()
    // The short key wins; the long one is only consulted when the short one is absent or empty.
    private getJsonValue(data: Record<string, unknown>, shortKey: string, longKey: string | null = null): string | null
    {
        let value = data[shortKey] ?? null;

        if((value === null || value === '') && longKey !== null)
        {
            value = data[longKey] ?? null;
        }

        if(value === null) return null;

        return String(value);
    }

    /**
     * TS-only: AS3 hands the url to a `BitmapFileLoader` and waits on its
     * `AssetLoaderEventComplete`; this port awaits the decode directly. The body of
     * `onImageLoaded()` below is the AS3 listener, unchanged.
     */
    // TS-only: replaces AS3's BitmapFileLoader + AssetLoaderEventComplete listener pair.
    private async loadImage(url: string): Promise<void>
    {
        try
        {
            const response = await fetch(url);
            const image = await createImageBitmap(await response.blob());

            this.onImageLoaded(image);
        }
        catch (error)
        {
            log.debug(`Photo ${url} could not be loaded: ${String(error)}`);
        }
    }

    /**
     * The loader's own size is set from the photo plus the 1px border on each side, *before*
     * `drawImage()` reads it back — which is what makes the frame fit whatever arrived.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/furniture/externalimage/ExternalImageWidget.as::onImageLoaded()
    private onImageLoaded(image: ImageBitmap): void
    {
        if(this._imageLoaderWindow === null) return;

        this._imageLoaderWindow.width = image.width + ExternalImageWidget.BORDER_THICKNESS * 2;
        this._imageLoaderWindow.height = image.height + ExternalImageWidget.BORDER_THICKNESS * 2;

        this.drawImage(image);
    }

    /**
     * Lays the whole window out around the photo and paints it with a 1px black outline.
     *
     * AS3 gets the outline by drawing the photo four times through a black `ColorTransform` at
     * (0,1), (1,0), (1,2) and (2,1), then the photo itself at (1,1). This port composes the same
     * five draws on an OffscreenCanvas: the four offset copies are flattened to a black silhouette
     * with `source-in`, and the photo goes on top.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/furniture/externalimage/ExternalImageWidget.as::drawImage()
    private drawImage(image: ImageBitmap | null): void
    {
        if(this._window === null || this._imageLoaderWindow === null) return;

        this._photo = image;

        this._window.visible = true;

        const previousButton = this._window.findChildByName('previousButton');
        const nextButton = this._window.findChildByName('nextButton');
        const spacing = ExternalImageWidget.HORIZONTAL_ITEM_SPACING;
        const buttonWidth = previousButton?.width ?? 0;

        if(previousButton !== null) previousButton.x = spacing;

        if(this._bgBorder !== null)
        {
            this._bgBorder.x = 0;
            this._bgBorder.y = 0;
        }

        this._imageLoaderWindow.x = spacing * 2 + buttonWidth;
        this._imageLoaderWindow.y = ExternalImageWidget.VERTICAL_SPACE;

        this._window.height = this._imageLoaderWindow.height + ExternalImageWidget.VERTICAL_SPACE * 2;
        this._window.width = this._imageLoaderWindow.width + spacing * 4 + buttonWidth * 2;

        if(this._bgBorder !== null)
        {
            this._bgBorder.height = this._window.height;
            this._bgBorder.width = this._window.width;
        }

        const imageRight = this._imageLoaderWindow.x + this._imageLoaderWindow.width;
        const imageBottom = this._imageLoaderWindow.y + this._imageLoaderWindow.height;

        if(this._senderNameButton !== null)
        {
            this._senderNameButton.x = imageRight - this._senderNameButton.width - 3;
            // AS3 sets y twice: to bottom + 3 here, then to bottom in the same chain as the date
            // label two lines down. The second assignment wins, so the +3 never takes effect.
            this._senderNameButton.y = imageBottom;
        }

        if(this._creationDateLabel !== null)
        {
            this._creationDateLabel.x = this._imageLoaderWindow.x + 3;
            this._creationDateLabel.y = imageBottom;
        }

        if(this._buttonContainer !== null && this._bgBorder !== null)
        {
            this._buttonContainer.y = 0;
            this._buttonContainer.x = (this._bgBorder.x + this._bgBorder.width) - this._buttonContainer.width;
        }

        if(nextButton !== null) nextButton.x = imageRight + spacing;

        // Opened from the inventory there is nothing to browse; in the room, the arrows appear
        // only once a second photo of the same type is hanging.
        const arrowsVisible = this._fromInventory ? false : this.getWallItemsOfCurrentTypeInRoom().length > 1;

        if(nextButton !== null) nextButton.visible = arrowsVisible;
        if(previousButton !== null) previousButton.visible = arrowsVisible;

        this._imageLoaderWindow.bitmap = this.composeOutlinedBitmap(
            image, this._imageLoaderWindow.width, this._imageLoaderWindow.height
        );

        this._window.activate();
        this.updateWindowPosition();
    }

    /**
     * TS-only: the OffscreenCanvas form of AS3's five `BitmapData.draw()` calls — see
     * `drawImage()`. A null photo yields the transparent canvas AS3's zero-filled BitmapData
     * amounts to.
     */
    // TS-only: the OffscreenCanvas form of AS3's five BitmapData.draw() calls in drawImage().
    private composeOutlinedBitmap(image: ImageBitmap | null, width: number, height: number): ImageBitmap | null
    {
        if(width <= 0 || height <= 0) return null;

        const canvas = new OffscreenCanvas(width, height);
        const context = canvas.getContext('2d');

        if(context === null) return null;

        if(image !== null)
        {
            const offset = ExternalImageWidget.BORDER_THICKNESS;
            const silhouette = [[0, offset], [offset, 0], [offset, offset * 2], [offset * 2, offset]];

            for(const [x, y] of silhouette) context.drawImage(image, x, y);

            context.globalCompositeOperation = 'source-in';
            context.fillStyle = '#000000';
            context.fillRect(0, 0, width, height);

            context.globalCompositeOperation = 'source-over';
            context.drawImage(image, offset, offset);
        }

        return canvas.transferToImageBitmap();
    }

    /**
     * The externally-hosted case. The fetch is deliberately plain and unauthenticated — its 403 is
     * what tells the widget the photo was moderated away, and an empty 200 body is treated as
     * "nothing to show" rather than as an error.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/furniture/externalimage/ExternalImageWidget.as::loadExternalData()
    private loadExternalData(): void
    {
        const url = (this.ownHandler?.extraDataServiceUrl ?? '') + (this._extraDataId ?? '');

        fetch(url)
            .then(async (response) =>
            {
                this.onExternalDataHttpStatus(response.status);

                return response.text();
            })
            .then((body) => this.onExternalDataLoaded(body))
            .catch((error: Error) => this.onExternalDataError(error));
    }

    /**
     * The moderation notice is shown only to someone who could have removed the photo anyway —
     * everyone else just sees an empty frame and is told nothing.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/furniture/externalimage/ExternalImageWidget.as::onExternalDataHttpStatus()
    private onExternalDataHttpStatus(status: number): void
    {
        if(status === ExternalImageWidget.MODERATED_HTTP_STATUS && (this.ownHandler?.hasRightsToRemove() ?? false))
        {
            if(this._moderationText !== null) this._moderationText.visible = true;
        }
    }

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::onExternalDataError()
    // Silent when the moderation notice is already up: a 403 reaches both handlers, and the notice
    // is the better explanation of the two.
    private onExternalDataError(error: Error): void
    {
        if(this._moderationText === null || !this._moderationText.visible)
        {
            log.warn(`Extra data loading failed: ${String(error)}`);
        }
    }

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::onExternalDataLoaded()
    private onExternalDataLoaded(body: string): void
    {
        if(body.length === 0) return;

        this.loadPhoto(body, null);
    }

    /**
     * Centres the window, unless the photo is wider or taller than the screen allows — in which
     * case that axis is pinned to a 50px margin instead, so the top-left of an oversized photo
     * stays reachable.
     *
     * AS3 measures against `stage.stageWidth/stageHeight`. This port has no Flash stage; the
     * desktop window is its equivalent and is what every other ported widget measures against.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/furniture/externalimage/ExternalImageWidget.as::updateWindowPosition()
    private updateWindowPosition(): void
    {
        if(this._window === null) return;

        if(this._photo === null)
        {
            this._window.center();
            // The overlay is a DOM element in page coordinates, so it has to be told: it does not
            // move with the window the way a Flash TextField parented to it would.
            this._staffNameField.sync();

            return;
        }

        const desktop = this._window.desktop;

        if(desktop === null) return;

        const horizontalFit = (desktop.width - ExternalImageWidget.SCREEN_MARGIN_X) / this._photo.width;
        const verticalFit = (desktop.height - ExternalImageWidget.SCREEN_MARGIN_Y) / this._photo.height;

        this._window.x = horizontalFit < 1
            ? ExternalImageWidget.SCREEN_EDGE_OFFSET
            : (desktop.width - this._window.width) * 0.5;

        this._window.y = verticalFit < 1
            ? ExternalImageWidget.SCREEN_EDGE_OFFSET
            : (desktop.height - this._window.height) * 0.5;

        const previousButton = this._window.findChildByName('previousButton');
        const nextButton = this._window.findChildByName('nextButton');
        const buttonHeight = previousButton?.height ?? 0;
        const borderHeight = this._bgBorder?.height ?? 0;

        // A photo taller than the screen centres its arrows on the *screen* rather than on the
        // photo, so they stay in view.
        const arrowY = borderHeight > desktop.height
            ? desktop.height / 2 - buttonHeight / 2
            : borderHeight / 2 - buttonHeight / 2;

        if(previousButton !== null) previousButton.y = arrowY;
        if(nextButton !== null) nextButton.y = arrowY;

        this._staffNameField.sync();
    }

    /**
     * One procedure for the whole window. The resize branch runs for events on the window itself;
     * everything below it is keyed on the clicked child's name.
     */
    // DEVIATION: AS3's `makeOwnButton` raises CAMERA_TOGGLE for a photo poster; the RPG fork removed
    //   photos, and that button is hidden for a photo poster.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/furniture/externalimage/ExternalImageWidget.as::onWindowEvent()
    private onWindowEvent = (event: WindowEvent, target: IWindow): void =>
    {
        if(target === this._window && event.type === 'WE_PARENT_RESIZED')
        {
            this.updateWindowPosition();
        }

        if(event.type !== 'WME_CLICK') return;

        switch(target.name)
        {
            case 'closebutton':
                this.hide();

                break;

            case 'removebutton':
            {
                const dialog = this.windowManager.confirm(
                    this.localizations?.getLocalization('inventory.remove.external_image_wallitem_header') ?? '',
                    this.localizations?.getLocalization('inventory.remove.external_image_wallitem_body') ?? '',
                    0,
                    this.onDeleteConfirm
                );

                // 16 is the OK button's flag; the confirm dialog's default caption is replaced by
                // the explicit "delete" wording.
                dialog?.setButtonCaption(16, new AlertDialogCaption(
                    this.localizations?.getLocalization('inventory.remove.external_image_wallitem_delete') ?? '',
                    '',
                    true
                ));

                break;
            }

            case 'makeOwnButton':
                // A selfie goes to the web — to the SPA route when `spaweb` is on, otherwise through
                // the legacy game link. AS3's photo-poster branch (the in-client camera) is gone with
                // photos; `show()` hides the button for a photo poster.
                if(this._roomUI?.getInteger('spaweb', 0) === 1)
                {
                    HabboWebTools.openPage('/stories/cards/selfie/edit');

                    break;
                }

                this._roomUI?.context.createLinkEvent('games/play/elisa_habbo_stories?ref=btn_selfie_myo');

                break;

            case 'shareButton':
                if(this._shareArea !== null) this._shareArea.visible = true;

                this.trackShareEvent('shareopened');

                break;

            case 'twitterShare':
                window.open(`http://www.twitter.com/share?url=${this._shareUrl ?? ''}`, '_blank');
                this.trackShareEvent('twitter');

                break;

            case 'fbShare':
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${this._shareUrl ?? ''}`, '_blank');
                this.trackShareEvent('facebook');

                break;

            case 'senderNameButton':
                this.ownHandler?.sendMessage(new GetExtendedProfileMessageComposer(this._creatorId));

                break;

            case 'urlField':
            {
                const urlField = this._window?.findChildByName('urlField') as ITextFieldWindow | null;

                // Selects the whole share url so one click is enough to copy it. AS3 reads
                // `length` off the text field; the port exposes the text itself.
                urlField?.setSelection(0, urlField.text.length);
                this.trackShareEvent('fieldselected');

                break;
            }

            case 'reportButton':
                this.openReportImage();

                break;

            case 'nextButton':
                this.showNext();

                break;

            case 'previousButton':
                this.showPrevious();

                break;
        }
    };

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::onClickModerationInfoLink()
    // The moderation notice's link goes to the web, not through the client's link router.
    private onClickModerationInfoLink = (event: WindowLinkEvent): void =>
    {
        if(event !== null && !StringUtil.isBlank(event.link))
        {
            window.open(event.link, '_blank');
        }
    };

    /**
     * TS-only: AS3 calls the `HabboTracking` singleton four times with the same three leading
     * arguments; this port reaches tracking through the handler's container, so the repetition is
     * folded into one call site.
     */
    // TS-only: folds AS3's four HabboTracking.getInstance().trackEventLog() call sites into one.
    private trackShareEvent(value: string): void
    {
        this.ownHandler?.container?.habboTracking?.trackEventLog(
            'Stories', value, 'stories.share.clicked', this._furniType
        );
    }

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::openReportImage()
    // The current report path — it replaced the in-widget dialog `onReportWindowEvent()` below
    // still services.
    private openReportImage(): void
    {
        this._habboHelp?.startPhotoReportingInNewCfhFlow(
            this._creatorId,
            this._senderNameLabel?.caption ?? '',
            this._extraDataId ?? '',
            this._objectId
        );
    }

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::getType()
    // Both poster sizes are one type; the plain selfie wall item is another; anything else is
    // legacy, which behaves as a selfie everywhere it is tested.
    private getType(): string
    {
        switch(this._furniType)
        {
            case ExternalImageWidget.FURNI_TYPE_POSTER:
            case ExternalImageWidget.FURNI_TYPE_POSTER_SMALL:
                return ExternalImageWidget.TYPE_PHOTO_POSTER;

            case ExternalImageWidget.FURNI_TYPE_SELFIE:
                return ExternalImageWidget.TYPE_SELFIE;

            default:
                return ExternalImageWidget.TYPE_LEGACY;
        }
    }

    /**
     * AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::onReportWindowEvent()
     *
     * Dead in AS3: `reportWindow` is never assigned, so this procedure is never installed on
     * anything and neither branch can run. It is the older in-widget report dialog, superseded by
     * `openReportImage()`. Ported rather than dropped so the two report paths stay visible — see
     * the note on `reportWindow`.
     *
     * DEVIATION: the reason dropdown and the free-text input are read out of a window this class
     *   does not build — and neither does AS3's, which is the point: `reportWindow` is assigned
     *   nowhere in the primary tree, so the branch that would read them cannot run in Flash either.
     *   Building the dialog here would be inventing UI the source does not have, not porting it.
     *   If it is ever revived, `reporting_reason` (a selector whose selected child's *name* is the
     *   topic id) and `input_widget` (an Illumina input widget) are what it must contain.
     *   Reclassified from a TODO on 2026-09-05.
     */
    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::onReportWindowEvent()
    private onReportWindowEvent = (event: WindowEvent, target: IWindow): void =>
    {
        if(event.type !== 'WME_CLICK') return;

        switch(target.name)
        {
            case 'header_button_close':
                this._reportWindow?.dispose();

                break;

            case 'report_confirm':
            {
                let topicId = 0;
                const reason = this._reportWindow?.findChildByName('reporting_reason') ?? null;

                if(reason !== null)
                {
                    const selected = (reason as unknown as {getSelected?: () => IWindow | null}).getSelected?.() ?? null;

                    if(selected !== null) topicId = Math.trunc(Number(selected.name)) || 0;
                }

                let description: string | null = null;
                const input = this._reportWindow?.findChildByName('input_widget') ?? null;

                if(input !== null)
                {
                    const widget = (input as unknown as {widget?: {message?: string}}).widget ?? null;

                    description = widget?.message ?? null;
                }

                // AS3 substitutes this literal rather than skipping the field, so the report is
                // sent either way.
                if(this._shareUrl === null || this._shareUrl === '') this._shareUrl = 'url not available';

                const reported = this.getType() === ExternalImageWidget.TYPE_PHOTO_POSTER
                    ? (this._habboHelp?.reportPhoto(
                        this._extraDataId ?? '', topicId, this._roomEngine?.activeRoomId ?? 0, this._creatorId, this._objectId
                    ) ?? false)
                    : (this._habboHelp?.reportSelfie(
                        this._shareUrl, description ?? '', this._roomEngine?.activeRoomId ?? 0, this._creatorId, this._objectId
                    ) ?? false);

                if(reported) this._reportWindow?.dispose();

                break;
            }
        }
    };

    // AS3: .../widget/furniture/externalimage/ExternalImageWidget.as::onDeleteConfirm()
    // The dialog disposes itself first, whichever button was pressed.
    private onDeleteConfirm = (dialog: {dispose: () => void}, event: WindowEvent): void =>
    {
        dialog.dispose();

        if(event.type === 'WE_OK')
        {
            this.ownHandler?.deleteCard(this._objectId);
        }

        void this.onReportWindowEvent;
    };
}
