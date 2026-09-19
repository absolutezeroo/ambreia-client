import type { IWindowContainer } from '@core/window/IWindowContainer';
import type { IItemListWindow } from '@core/window/components/IItemListWindow';
import type { OfficialRoomEntryData } from '../../communication/messages/incoming/navigator/OfficialRoomEntryData';
import type { IHabboTransitionalNavigator } from '../IHabboTransitionalNavigator';
import type { IViewCtrl } from '../IViewCtrl';
import { PromotedRoomsListCtrl } from './PromotedRoomsListCtrl';

/**
 * Displays official rooms with promoted category headers and folder-filtered entries.
 *
 * @see sources/win63_version/habbo/navigator/mainview/OfficialRoomListCtrl.as
 */
export class OfficialRoomListCtrl implements IViewCtrl
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/mainview/OfficialRoomListCtrl.as::_navigator
    private _navigator: IHabboTransitionalNavigator;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/mainview/OfficialRoomListCtrl.as::_content
    private _content: IWindowContainer | null = null;
    private _itemList: IItemListWindow | null = null;
    private _promotedRoomsListCtrl: PromotedRoomsListCtrl;

    constructor(navigator: IHabboTransitionalNavigator)
    {
        this._navigator = navigator;
        this._promotedRoomsListCtrl = new PromotedRoomsListCtrl(navigator);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/mainview/OfficialRoomListCtrl.as::dispose()
    dispose(): void
    {
        if(this._promotedRoomsListCtrl)
        {
            this._promotedRoomsListCtrl.dispose();
            this._promotedRoomsListCtrl = null!;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/mainview/OfficialRoomListCtrl.as::get content()
    get content(): IWindowContainer | null
    {
        return this._content;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/mainview/OfficialRoomListCtrl.as::set content()
    set content(value: IWindowContainer | null)
    {
        this._content = value;
        this._itemList = value ? value.findChildByName('item_list_official') as IItemListWindow : null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/mainview/OfficialRoomListCtrl.as::refresh()
    refresh(): void
    {
        if(!this._itemList) return;

        const visibleEntries = this.getVisibleEntries();

        this._itemList.autoArrangeItems = false;

        this.refreshPromotedRooms();

        let i = 0;

        while(true)
        {
            const isOdd = i % 2 !== 0;
            const entry = this._itemList.getListItemAt(i + 1) as IWindowContainer | null;

            if(i < visibleEntries.length)
            {
                this.refreshEntry(true, isOdd, entry, visibleEntries[i]);
            }
            else
            {
                const done = this.refreshEntry(false, isOdd, entry, null);

                if(done) break;
            }

            i++;
        }

        this._itemList.autoArrangeItems = true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/mainview/OfficialRoomListCtrl.as::getVisibleEntries()
    private getVisibleEntries(): OfficialRoomEntryData[]
    {
        const all = this._navigator.data.officialRooms?.entries ?? [];
        const visible: OfficialRoomEntryData[] = [];
        let openFolderId = 0;

        for(const entry of all)
        {
            if(entry.folderId > 0)
            {
                if(entry.folderId === openFolderId)
                {
                    visible.push(entry);
                }
            }
            else
            {
                openFolderId = entry.open ? entry.index : 0;
                visible.push(entry);
            }
        }

        return visible;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/mainview/OfficialRoomListCtrl.as::refreshEntry()
    private refreshEntry(
        show: boolean,
        isOdd: boolean,
        entry: IWindowContainer | null,
        data: OfficialRoomEntryData | null
    ): boolean
    {
        if(entry === null)
        {
            if(!show) return true;

            const created = this._navigator.officialRoomEntryManager!.createEntry(isOdd);

            // AS3 cannot fail here and has no guard. The port's `createEntry()` can return null,
            // and `false` means "keep going" to the `while(true)` caller — so a missing layout
            // hung the browser instead of stopping the list.
            if(created === null) return true;

            this._itemList!.addListItem(created);
            entry = created;
        }

        this._navigator.officialRoomEntryManager!.refreshEntry(entry, show, data);

        return false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/mainview/OfficialRoomListCtrl.as::refreshPromotedRooms()
    private refreshPromotedRooms(): void
    {
        const promotedContainer = this._itemList!.getListItemAt(0) as IWindowContainer | null;

        if(promotedContainer === null) return;

        this._promotedRoomsListCtrl.refresh(
            promotedContainer,
            this._navigator.data.promotedRooms?.entries ?? []
        );
    }
}
