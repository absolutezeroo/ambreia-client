import type {IDisposable} from '@core/runtime/IDisposable';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IHabboTransitionalNavigator} from '../IHabboTransitionalNavigator';
import type {OfficialRoomEntryData} from '@habbo/communication/messages/incoming/navigator/OfficialRoomEntryData';
import {UserCountRenderer} from '../UserCountRenderer';
import {Util} from '../Util';

/**
 * Manages creation and display of official room entries.
 *
 * @see sources/win63_version/habbo/navigator/mainview/OfficialRoomEntryManager.as
 */
export class OfficialRoomEntryManager implements IDisposable
{
    // Twenty of this class's twenty-seven AS3 methods are absent — every one of them the entry's
    // interactive and detail layer: `handleClick`, `onCellMouseClick/Over/Out`, `refreshCell`,
    // `refreshCustomImage`, `refreshDetails`, `refreshFolderEntry`, `getEntry`. This note is here so
    // the next hollow-port sweep stops re-deriving that, and stops reading it as a broken feature.
    //
    // Nothing calls `createEntry()` or `refreshEntry()` in this port. `LegacyNavigator` constructs
    // the class and `OfficialTabPageDecorator` uses exactly one member, `refreshAdFooter()`. The
    // live path for entering a room from a navigator result is the new navigator's
    // `RoomEntryElementFactory`, which wires `go_to_room_region` to `onGoButtonClicked` — that is
    // what AS3's `handleClick` corresponds to here, and it works.
    //
    // So these are not a gap in a reachable feature; they are the unported half of a superseded
    // legacy path. Port them if and when the legacy official tab is driven again, not before:
    // twenty methods written against a caller that does not exist is twenty methods nobody can
    // check.

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/mainview/OfficialRoomEntryManager.as::HOTTEST_GROUPS_TAG
    private static readonly HOTTEST_GROUPS_TAG: string = 'hottest_groups';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/mainview/OfficialRoomEntryManager.as::IMAGE_WIDTH_WIDE
    private static readonly IMAGE_WIDTH_WIDE: number = 267;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/mainview/OfficialRoomEntryManager.as::IMAGE_WIDTH_NARROW
    private static readonly IMAGE_WIDTH_NARROW: number = 65;
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
	 * Creates an official room entry container.
	 *
	 * @param isWide - Whether to create a wide entry
	 * @returns The entry container
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/mainview/OfficialRoomEntryManager.as::createEntry()
    createEntry(isWide: boolean): IWindowContainer | null
    {
        if(!this._navigator) return null;

        const xmlName = isWide ? 'orl_wide_entry' : 'orl_narrow_entry';
        const window = this._navigator.getXmlWindow(xmlName);

        return window as unknown as IWindowContainer | null;
    }

    /**
	 * Refreshes an official room entry with data.
	 *
	 * @param container - The entry container
	 * @param isWide - Whether this is a wide entry
	 * @param entryData - The entry data to display
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/mainview/OfficialRoomEntryManager.as::refreshEntry()
    refreshEntry(container: IWindowContainer, isWide: boolean, entryData: unknown): void
    {
        if(!container || !entryData) return;

        Util.hideChildren(container);

        // Delegate to appropriate refresh based on entry type
        this.refreshNormalEntry(container, isWide, entryData);
    }

    /**
	 * Refreshes the ad footer.
	 *
	 * @param container - The footer container
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/mainview/OfficialRoomEntryManager.as::refreshAdFooter()
    refreshAdFooter(container: IWindowContainer): void
    {
        if(!container) return;

        container.visible = false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/mainview/OfficialRoomEntryManager.as::dispose()
    dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;
        this._userCountRenderer.dispose();
        this._navigator = null;
    }

    // DEVIATION: AS3 fills the entry here — `refreshCell`, `refreshDetails`, `refreshUserCount`,
    //   height 68. None of those three is ported, deliberately and for the reason set out at the
    //   top of this class: nothing calls `refreshEntry()`, and the live path for a navigator
    //   result is the new navigator's `RoomEntryElementFactory`. Also note AS3 takes TWO
    //   parameters where this takes three, so the ranks do not line up.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/mainview/OfficialRoomEntryManager.as::refreshNormalEntry()
    private refreshNormalEntry(container: IWindowContainer, _isWide: boolean, _entryData: unknown): void
    {
        container.visible = true;
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
