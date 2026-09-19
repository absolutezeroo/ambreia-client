import type {IDisposable} from '@core/runtime/IDisposable';
import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IBitmapWrapperWindow} from '@core/window/components/IBitmapWrapperWindow';
import type {ITextWindow} from '@core/window/components/ITextWindow';
import type {WindowEvent} from '@core/window/events/WindowEvent';
import {WindowMouseEvent} from '@core/window/events/WindowMouseEvent';
import type {IHabboTransitionalNavigator} from '../IHabboTransitionalNavigator';
import type {OfficialRoomEntryData} from '@habbo/communication/messages/incoming/navigator/OfficialRoomEntryData';
import {Logger} from '@core/utils/Logger';
import {UserCountRenderer} from '../UserCountRenderer';
import {Util} from '../Util';
import {OfficialRoomImageLoader} from './OfficialRoomImageLoader';

const log = Logger.getLogger('habbo.navigator.mainview.OfficialRoomEntryManager');

/**
 * Builds and fills the rows of the legacy navigator's official room list, and the promoted-room
 * footer under it.
 *
 * Both are live paths: `OfficialRoomListCtrl.refreshEntry()` asks this class for every row of the
 * Official tab, and `OfficialTabPageDecorator`/`RoomsTabPageDecorator` route their footer through
 * `refreshAdFooter()`. An earlier note here claimed the opposite — that nothing called
 * `createEntry()`/`refreshEntry()` and that the entry layer was a superseded path safely left
 * unported. It was wrong on both counts, and while it stood the Official tab rendered empty rows
 * and the promoted-room footer never appeared at all.
 *
 * @see sources/win63_version/habbo/navigator/mainview/OfficialRoomEntryManager.as
 */
export class OfficialRoomEntryManager implements IDisposable
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/mainview/OfficialRoomEntryManager.as::HOTTEST_GROUPS_TAG
    private static readonly HOTTEST_GROUPS_TAG: string = 'hottest_groups';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/mainview/OfficialRoomEntryManager.as::IMAGE_WIDTH_WIDE
    private static readonly IMAGE_WIDTH_WIDE: number = 267;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/mainview/OfficialRoomEntryManager.as::IMAGE_WIDTH_NARROW
    private static readonly IMAGE_WIDTH_NARROW: number = 65;
    // Declared and never read in the AS3 either — kept so the constant block matches the source.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/mainview/OfficialRoomEntryManager.as::NARROW_IMAGE_OFFSET
    private static readonly NARROW_IMAGE_OFFSET: number = -70;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/mainview/OfficialRoomEntryManager.as::_navigator
    private _navigator: IHabboTransitionalNavigator | null;
    private _userCountRenderer: UserCountRenderer;

    constructor(navigator: IHabboTransitionalNavigator)
    {
        this._navigator = navigator;
        this._userCountRenderer = new UserCountRenderer(navigator);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/mainview/OfficialRoomEntryManager.as::_disposed
    private _disposed: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/mainview/OfficialRoomEntryManager.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }

    /**
     * Creates an official room entry row.
     *
     * `isOdd` alternates the row background and the rounded end-cap variant — it is the row
     * parity `OfficialRoomListCtrl` computes, not a width. The port read it as "wide" and asked
     * for `orl_wide_entry`/`orl_narrow_entry`, two layouts that do not exist in the asset set, so
     * every call returned null.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/mainview/OfficialRoomEntryManager.as::createEntry()
    createEntry(isOdd: boolean): IWindowContainer | null
    {
        const navigator = this._navigator;

        if(navigator === null) return null;

        const entry = navigator.getXmlWindow('grs_official_room_row_phase_one') as unknown as IWindowContainer | null;

        if(entry === null)
        {
            log.warn('Missing layout "grs_official_room_row_phase_one_xml" — the official room list has no rows');

            return null;
        }

        const suffix = isOdd ? '' : '_b';

        for(const name of ['image_cont', 'folder_cont'])
        {
            const container = entry.findChildByName(name) as unknown as IWindowContainer | null;

            if(container === null) continue;

            navigator.refreshButton(container, 'rico_rnd_l' + suffix, true, null, 0);
            navigator.refreshButton(container, 'rico_rnd_r' + suffix, true, null, 0);

            const middle = container.findChildByName('rico_rnd_m') as unknown as IBitmapWrapperWindow | null;

            if(middle !== null)
            {
                middle.bitmap = navigator.getButtonImage('rico_rnd_m');
                middle.disposesBitmap = false;
            }
        }

        entry.addEventListener(WindowMouseEvent.OVER, (event: WindowEvent) => this.onCellMouseOver(event));
        entry.addEventListener(WindowMouseEvent.OUT, (event: WindowEvent) => this.onCellMouseOut(event));
        entry.addEventListener(WindowMouseEvent.CLICK, (event: WindowEvent) => this.onCellMouseClick(event));
        (entry as unknown as IWindow).color = isOdd ? 0xFFFFFFFF : 0xFFDEE4F2;

        return entry;
    }

    /**
     * Fills a row with an entry, or collapses it to nothing when the list is shorter than the
     * pool of rows it reuses.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/mainview/OfficialRoomEntryManager.as::refreshEntry()
    refreshEntry(container: IWindowContainer, show: boolean, entryData: OfficialRoomEntryData | null): void
    {
        Util.hideChildren(container);

        if(!show || entryData === null)
        {
            container.height = 0;
            container.visible = false;

            return;
        }

        (container as unknown as IWindow).id = entryData.index;

        if(entryData.type === 4) this.refreshFolderEntry(container, entryData);
        else this.refreshNormalEntry(container, entryData);

        container.visible = true;
    }

    /**
     * Fills the promoted-room footer of a tab page: the `ad_footer` inside the page's footer
     * container, whose `ad_cont` holds a single entry row built on demand.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/mainview/OfficialRoomEntryManager.as::refreshAdFooter()
    refreshAdFooter(container: IWindowContainer): void
    {
        const navigator = this._navigator;

        if(navigator === null || container === null) return;

        const adRoom = navigator.data.adRoom;

        if(adRoom === null) return;

        // Direct children, as in AS3: `grs_main_window_new` puts `ad_footer` under `custom_footer`
        // and `ad_cont` under `ad_footer`.
        const footer = container.getChildByName('ad_footer') as unknown as IWindowContainer | null;

        if(footer === null) return;

        const adContainer = footer.getChildByName('ad_cont') as unknown as IWindowContainer | null;

        if(adContainer === null) return;

        if(adContainer.numChildren < 1)
        {
            const entry = this.createEntry(true);

            if(entry === null) return;

            adContainer.addChild(entry as unknown as IWindow);
        }

        this.refreshEntry(adContainer.getChildAt(0) as unknown as IWindowContainer, true, adRoom);
        footer.visible = true;
        navigator.data.adIndex++;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/mainview/OfficialRoomEntryManager.as::dispose()
    dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;
        this._userCountRenderer.dispose();
        this._navigator = null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/mainview/OfficialRoomEntryManager.as::refreshNormalEntry()
    private refreshNormalEntry(container: IWindowContainer, entry: OfficialRoomEntryData): void
    {
        this.refreshCell(container, entry);
        this.refreshDetails(container, entry);
        this.refreshUserCount(container, entry);
        container.height = 68;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/mainview/OfficialRoomEntryManager.as::refreshFolderEntry()
    private refreshFolderEntry(container: IWindowContainer, entry: OfficialRoomEntryData): void
    {
        const navigator = this._navigator;

        if(navigator === null) return;

        const folderContainer = container.findChildByName('folder_cont') as unknown as IWindowContainer | null;

        if(folderContainer === null) return;

        folderContainer.visible = true;

        const nameText = folderContainer.findChildByName('folder_name_text') as unknown as ITextWindow | null;
        const arrowLabel = folderContainer.findChildByName('arrow_label') as unknown as ITextWindow | null;

        if(nameText !== null) nameText.text = entry.popupCaption;
        if(arrowLabel !== null) arrowLabel.text = entry.open ? '${navigator.folder.hide}' : '${navigator.folder.show}';

        navigator.refreshButton(folderContainer, 'arrow_down_white', entry.open, null, 0);
        navigator.refreshButton(folderContainer, 'arrow_right_white', !entry.open, null, 0);
        this.refreshFolderImage(folderContainer, entry);
        container.height = 68;

        const nameContainer = container.findChildByName('folderNameContainer') as unknown as IWindowContainer | null;

        if(nameContainer === null) return;

        if(nameText === null || nameText.text === '')
        {
            nameContainer.visible = false;

            return;
        }

        nameContainer.visible = true;

        if(!navigator.isPerkAllowed('NAVIGATOR_PHASE_ONE_2014')) nameContainer.width = nameText.textWidth + 20;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/mainview/OfficialRoomEntryManager.as::refreshUserCount()
    private refreshUserCount(container: IWindowContainer, entry: OfficialRoomEntryData): void
    {
        if(!entry.showDetails || entry.type !== 2) return;

        this._userCountRenderer.refreshUserCount(
            entry.maxUsers,
            container,
            entry.userCount,
            '${navigator.usercounttooltip.users}',
            container.width - 3 - 34,
            container.height - 3 - 13
        );
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/mainview/OfficialRoomEntryManager.as::refreshCell()
    private refreshCell(container: IWindowContainer, entry: OfficialRoomEntryData): void
    {
        const imageContainer = container.findChildByName('image_cont') as unknown as IWindowContainer | null;

        if(imageContainer === null) return;

        imageContainer.visible = true;
        imageContainer.width = entry.showDetails ? OfficialRoomEntryManager.IMAGE_WIDTH_NARROW : OfficialRoomEntryManager.IMAGE_WIDTH_WIDE;
        this.refreshPicText(imageContainer, entry);
        this.refreshRoomImage(imageContainer, entry);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/mainview/OfficialRoomEntryManager.as::refreshPicText()
    private refreshPicText(container: IWindowContainer, entry: OfficialRoomEntryData): void
    {
        const textContainer = container.findChildByName('picTextContainer') as unknown as IWindowContainer | null;

        if(textContainer === null) return;

        if(entry.picText === '' || entry.showDetails)
        {
            textContainer.visible = false;

            return;
        }

        textContainer.visible = true;

        const text = textContainer.findChildByName('picText') as unknown as ITextWindow | null;

        if(text === null) return;

        text.text = entry.picText;
        (text as unknown as IWindow).height = text.textHeight + 10;
        textContainer.height = (text as unknown as IWindow).height + 4;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/mainview/OfficialRoomEntryManager.as::refreshFolderImage()
    private refreshFolderImage(container: IWindowContainer, entry: OfficialRoomEntryData): void
    {
        const image = container.findChildByName('folder_image') as unknown as IBitmapWrapperWindow | null;

        if(image === null) return;

        (image as unknown as IWindow).visible = false;

        if(entry.picRef !== '') this.refreshCustomImage(entry, image);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/mainview/OfficialRoomEntryManager.as::refreshRoomImage()
    private refreshRoomImage(container: IWindowContainer, entry: OfficialRoomEntryData): void
    {
        const image = container.findChildByName('room_image') as unknown as IBitmapWrapperWindow | null;

        if(image === null) return;

        (image as unknown as IWindow).visible = false;

        if(entry.picRef !== '') this.refreshCustomImage(entry, image);
        else if(entry.guestRoomData !== null) this.refreshGuestRoomImage(entry, image);
        else this.refreshEmptyImage(image);
    }

    /**
     * The `tags[0]` marker is how AS3 avoids restarting a load for an image the window already
     * shows — the row windows are pooled and refreshed in place.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/mainview/OfficialRoomEntryManager.as::refreshCustomImage()
    private refreshCustomImage(entry: OfficialRoomEntryData, image: IBitmapWrapperWindow): void
    {
        const navigator = this._navigator;

        if(navigator === null) return;

        const window = image as unknown as IWindow;
        const tag = 'customImage.' + entry.picRef;

        if(window.tags[0] === tag)
        {
            window.visible = true;

            return;
        }

        log.debug('Loading custom image: ' + entry.picRef);

        window.x = 0;
        window.visible = false;

        new OfficialRoomImageLoader(navigator, entry.picRef, image).startLoad();

        window.tags.splice(0, window.tags.length);
        window.tags.push(tag);
    }

    // AS3 fills a blank white 64×64 BitmapData here and never draws the thumbnail into it —
    //   `guestRoomData.thumbnail` is read only to build the cache tag. Ported as written, white
    //   square included; it is not a gap to close into a thumbnail this build never showed.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/mainview/OfficialRoomEntryManager.as::refreshGuestRoomImage()
    private refreshGuestRoomImage(entry: OfficialRoomEntryData, image: IBitmapWrapperWindow): void
    {
        const window = image as unknown as IWindow;
        const tag = 'guestRoom.' + (entry.guestRoomData?.thumbnail.getAsString() ?? '');

        if(window.tags[0] === tag)
        {
            window.visible = true;

            return;
        }

        log.debug('Redrawing guest room image');

        window.x = 0;
        window.width = 64;
        image.bitmap = OfficialRoomEntryManager.solidBitmap(64, 64, '#ffffff');
        window.tags.splice(0, window.tags.length);
        window.tags.push(tag);
        window.visible = true;
    }

    // AS3 passes the cell container and the entry to this and to `refreshGuestRoomImage()` and
    //   reads neither; both take only what they use here.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/mainview/OfficialRoomEntryManager.as::refreshEmptyImage()
    private refreshEmptyImage(image: IBitmapWrapperWindow): void
    {
        const window = image as unknown as IWindow;

        if(window.tags[0] === 'empty')
        {
            window.visible = true;

            return;
        }

        log.debug('Redrawing empty image');

        window.x = 0;
        window.width = 64;
        image.bitmap = OfficialRoomEntryManager.solidBitmap(64, 64, '#cccccc');
        window.tags.splice(0, window.tags.length);
        window.tags.push('empty');
        window.visible = true;
    }

    // TS-only: Flash builds these two placeholders with `new BitmapData(w, h, false, argb)`, which
    //   has no counterpart here — a window's `bitmap` takes an `ImageBitmap`.
    private static solidBitmap(width: number, height: number, color: string): ImageBitmap | null
    {
        const canvas = new OffscreenCanvas(width, height);
        const context = canvas.getContext('2d');

        if(context === null) return null;

        context.fillStyle = color;
        context.fillRect(0, 0, width, height);

        return canvas.transferToImageBitmap();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/mainview/OfficialRoomEntryManager.as::onCellMouseOver()
    private onCellMouseOver(event: WindowEvent): void
    {
        this.setEnterArrowVisibility(event.target as IWindow | null, true);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/mainview/OfficialRoomEntryManager.as::onCellMouseOut()
    private onCellMouseOut(event: WindowEvent): void
    {
        this.setEnterArrowVisibility(event.target as IWindow | null, false);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/mainview/OfficialRoomEntryManager.as::onCellMouseClick()
    private onCellMouseClick(event: WindowEvent): void
    {
        this.handleClick(event.target as IWindow | null);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/mainview/OfficialRoomEntryManager.as::setEnterArrowVisibility()
    private setEnterArrowVisibility(target: IWindow | null, visible: boolean): void
    {
        const navigator = this._navigator;
        const row = target as unknown as IWindowContainer | null;

        if(navigator === null || row === null) return;

        const arrow = row.findChildByName('enter_room') as unknown as IWindowContainer | null;

        if(arrow === null) return;

        if(visible)
        {
            navigator.refreshButton(arrow, 'enter_room_l', true, null, 0);
            navigator.refreshButton(arrow, 'enter_room_r', true, null, 0);

            const middle = arrow.findChildByName('enter_room_m') as unknown as IBitmapWrapperWindow | null;

            if(middle !== null && middle.bitmap === null)
            {
                middle.bitmap = navigator.getButtonImage('enter_room_m');
                middle.disposesBitmap = false;
            }

            navigator.refreshButton(arrow, 'enter_room_a', true, null, 0);
        }

        arrow.visible = visible;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/mainview/OfficialRoomEntryManager.as::handleClick()
    private handleClick(target: IWindow | null): void
    {
        const navigator = this._navigator;
        const entry = this.getEntry(target);

        if(navigator === null || entry === null) return;

        if(entry.guestRoomData !== null)
        {
            log.debug('ENTERING ROOM: ' + entry.guestRoomData.flatId);

            if(entry.guestRoomData.doorMode === 2) navigator.passwordInput?.show(entry.guestRoomData);
            else navigator.goToRoom(entry.guestRoomData.flatId, true);

            return;
        }

        if(entry.tag !== '')
        {
            log.debug('MAKING TAG SEARCH: ' + entry.tag);

            if(entry.tag === OfficialRoomEntryManager.HOTTEST_GROUPS_TAG) navigator.performGuildBaseSearch();
            else navigator.mainViewCtrl?.startSearch(5, 9, entry.tag);

            return;
        }

        log.debug('FOLDER CLICKED: ' + entry.index);

        entry.toggleOpen();
        navigator.mainViewCtrl?.refresh();
    }

    /**
     * The clicked window has to be the row root itself — the layout names it `cont` — and its
     * parent says which list it belongs to.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/mainview/OfficialRoomEntryManager.as::getEntry()
    private getEntry(target: IWindow | null): OfficialRoomEntryData | null
    {
        const row = target as unknown as IWindowContainer | null;

        if(row === null || (row as unknown as IWindow).name !== 'cont') return null;

        const parent = (row as unknown as IWindow).parent;

        return parent !== null && parent.name === 'ad_cont' ? this.findAdEntry() : this.findEntryInOfficialRoomList(row);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/mainview/OfficialRoomEntryManager.as::findAdEntry()
    private findAdEntry(): OfficialRoomEntryData | null
    {
        return this._navigator?.data.adRoom ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/mainview/OfficialRoomEntryManager.as::findEntryInOfficialRoomList()
    private findEntryInOfficialRoomList(row: IWindowContainer): OfficialRoomEntryData | null
    {
        const officialRooms = this._navigator?.data.officialRooms ?? null;

        if(officialRooms === null)
        {
            log.debug('No official rooms data click');

            return null;
        }

        const index = (row as unknown as IWindow).id;

        for(const entry of officialRooms.entries)
        {
            if(entry.index === index) return entry;
        }

        log.debug(`No room found ${index}, ${officialRooms.entries.length}`);

        return null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/mainview/OfficialRoomEntryManager.as::refreshDetails()
    private refreshDetails(container: IWindowContainer, entry: OfficialRoomEntryData): void
    {
        const details = container.findChildByName('details_container') as unknown as IWindowContainer | null;

        if(details === null) return;

        details.visible = entry.showDetails;

        if(!entry.showDetails) return;

        Util.hideChildren(details);
        this.refreshEntryCaption(details, entry);
        this.refreshEntryDesc(details, entry);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/mainview/OfficialRoomEntryManager.as::refreshEntryCaption()
    private refreshEntryCaption(details: IWindowContainer, entry: OfficialRoomEntryData): void
    {
        const caption = details.getChildByName('entry_caption') as unknown as ITextWindow | null;

        if(caption === null) return;

        (caption as unknown as IWindow).visible = true;
        caption.text = this.getPopupCaption(entry);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/mainview/OfficialRoomEntryManager.as::refreshEntryDesc()
    private refreshEntryDesc(details: IWindowContainer, entry: OfficialRoomEntryData): void
    {
        const description = this.getPopupDesc(entry);

        if(description === '') return;

        const text = details.getChildByName('entry_desc') as unknown as ITextWindow | null;

        if(text === null) return;

        text.text = description;
        (text as unknown as IWindow).visible = true;
    }

    /**
     * The caption for an entry's details panel: its own popup caption, else the guest room's
     * name, else the search tag it represents, else a last-resort placeholder.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/mainview/OfficialRoomEntryManager.as::getPopupCaption()
    getPopupCaption(entry: OfficialRoomEntryData): string
    {
        if(entry.popupCaption !== '') return entry.popupCaption;

        if(entry.guestRoomData !== null) return entry.guestRoomData.roomName;

        if(entry.tag !== '') return entry.tag;

        return 'NA';
    }

    /**
     * The description for an entry's details panel: its own popup description (only once a popup
     * caption is set — AS3 gates on `popupCaption`, not `popupDesc`), else the guest room's
     * description, else empty.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/mainview/OfficialRoomEntryManager.as::getPopupDesc()
    getPopupDesc(entry: OfficialRoomEntryData): string
    {
        if(entry.popupCaption !== '') return entry.popupDesc;

        if(entry.guestRoomData !== null) return entry.guestRoomData.description;

        return '';
    }
}
