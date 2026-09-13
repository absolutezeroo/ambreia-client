import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IItemListWindow} from '@core/window/components/IItemListWindow';
import type {IStaticBitmapWrapperWindow} from '@core/window/components/IStaticBitmapWrapperWindow';
import type {IWidgetWindow} from '@core/window/components/IWidgetWindow';
import type {WindowEvent} from '@core/window/events/WindowEvent';
import type {GuestRoomData} from '@habbo/communication/messages/incoming/navigator/GuestRoomData';
import {AddFavouriteRoomMessageComposer} from '@habbo/communication/messages/outgoing/navigator/AddFavouriteRoomMessageComposer';
import {DeleteFavouriteRoomMessageComposer} from '@habbo/communication/messages/outgoing/navigator/DeleteFavouriteRoomMessageComposer';
import {UpdateHomeRoomMessageComposer} from '@habbo/communication/messages/outgoing/navigator/UpdateHomeRoomMessageComposer';
import {getLocalizationKey} from '@habbo/session/enum/RoomTradingLevelEnum';
import {FriendlyTime} from '@habbo/utils/FriendlyTime';
import type {IBadgeImageWidget} from '@habbo/window/widgets/IBadgeImageWidget';
import type {HabboNewNavigator} from '../HabboNewNavigator';
import type {LegacyNavigator} from '../transitional/LegacyNavigator';
import {PerkType} from '../../communication/enum/PerkType';

/**
 * Room info popup bubble shown when hovering over room entries.
 *
 * Displays room name, description, owner, group info, favorite/home toggles,
 * settings, tags, event info, and room properties.
 *
 * @see sources/win63_version/habbo/navigator/view/RoomInfoPopup.as
 */
export class RoomInfoPopup
{
    // AS3: .../src/com/sulake/habbo/navigator/view/RoomInfoPopup.as::_navigator
    private _navigator: HabboNewNavigator;
    // AS3: .../src/com/sulake/habbo/navigator/view/RoomInfoPopup.as::_window
    private _window: IWindowContainer | null = null;
    private _roomData: GuestRoomData | null = null;
    private _tags: string[] = [];
    private _lastPosition: { x: number; y: number } = { x: -1, y: -1 };

    /** Whether the roomIsHome value has been locally overridden */
    private _homeOverridden: boolean = false;
    private _homeOverrideValue: boolean = false;

    /** Whether the roomIsFavorite value has been locally overridden */
    private _favoriteOverridden: boolean = false;
    private _favoriteOverrideValue: boolean = false;

    constructor(navigator: HabboNewNavigator)
    {
        this._navigator = navigator;
    }

    /**
	 * Whether the popup is currently visible.
	 *
	 * @see sources/win63_version/habbo/navigator/view/RoomInfoPopup.as get visible()
	 */
    // AS3: .../src/com/sulake/habbo/navigator/view/RoomInfoPopup.as::get visible()
    get visible(): boolean
    {
        if(!this._window) return false;

        return this._window.visible;
    }

    /**
	 * Show or hide the popup.
	 *
	 * @param visible - Whether to show the popup
	 *
	 * @see sources/win63_version/habbo/navigator/view/RoomInfoPopup.as show()
	 */
    // AS3: .../src/com/sulake/habbo/navigator/view/RoomInfoPopup.as::show()
    show(visible: boolean): void
    {
        if(visible)
        {
            if(!this._window)
            {
                this.createWindow();
            }

            this.populate();
            if(this._window)
            {
                this._window.visible = true;
            }

            this._homeOverridden = false;
            this._favoriteOverridden = false;
        }
        else if(this._window)
        {
            this._window.visible = false;
        }
    }

    /**
	 * Show the popup at a specific position.
	 *
	 * @param visible - Whether to show the popup
	 * @param x - The x position
	 * @param y - The y position
	 *
	 * @see sources/win63_version/habbo/navigator/view/RoomInfoPopup.as showAt()
	 */
    // AS3: .../src/com/sulake/habbo/navigator/view/RoomInfoPopup.as::showAt()
    showAt(visible: boolean, x: number, y: number): void
    {
        const wasHidden = !this.visible;

        this.show(visible);

        if(visible && this._window)
        {
            const posX = x;
            const posY = y - this._window.height / 2;

            if(this._lastPosition.x !== posX || this._lastPosition.y !== posY)
            {
                if(wasHidden && visible && this._roomData)
                {
                    this._navigator.trackEventLog('browse.openroominfo', 'Results', this._roomData.roomName, this._roomData.flatId);
                }
            }

            this._window.x = posX;
            this._window.y = posY;
            this._lastPosition = { x: posX, y: posY };
            this._window.activate();
        }
    }

    /**
	 * Set the room data to display.
	 *
	 * @param data - The guest room data
	 *
	 * @see sources/win63_version/habbo/navigator/view/RoomInfoPopup.as setData()
	 */
    // AS3: .../src/com/sulake/habbo/navigator/view/RoomInfoPopup.as::setData()
    setData(data: GuestRoomData): void
    {
        this._roomData = data;
    }

    /**
	 * Get the global rectangle of the popup window.
	 *
	 * @param out - The rectangle to populate
	 *
	 * @see sources/win63_version/habbo/navigator/view/RoomInfoPopup.as getGlobalRectangle()
	 */
    // AS3: .../src/com/sulake/habbo/navigator/view/RoomInfoPopup.as::getGlobalRectangle()
    getGlobalRectangle(out: { x: number; y: number; width: number; height: number }): void
    {
        if(this._window)
        {
            this._window.getGlobalRectangle(out);
        }
    }

    /**
	 * Dispose the popup and clean up.
	 */
    dispose(): void
    {
        this.destroy();
        this._roomData = null;
    }

    /**
	 * Clears the local roomIsHome override and re-syncs the home icon from
	 * legacyNavigator's authoritative state. Called when fresh navigator
	 * settings (home room id) arrive from the server.
	 *
	 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/view/RoomInfoPopup.as::refreshHomeState()
	 */
    // AS3: .../src/com/sulake/habbo/navigator/view/RoomInfoPopup.as::refreshHomeState()
    refreshHomeState(): void
    {
        this._homeOverridden = false;

        if(this._window && this._window.visible && this._roomData)
        {
            const homeIcon = this._window.findChildByName('home_icon') as unknown as IStaticBitmapWrapperWindow | null;

            if(homeIcon)
            {
                homeIcon.assetUri = 'newnavigator_icon_home_' + (this.roomIsHome ? 'yes' : 'no');
            }
        }
    }

    // AS3: .../src/com/sulake/habbo/navigator/view/RoomInfoPopup.as::get roomIsHome()
    private get roomIsHome(): boolean
    {
        if(this._homeOverridden)
        {
            return this._homeOverrideValue;
        }

        return this._navigator.legacyNavigator.isRoomHome(this._roomData!.flatId);
    }

    // AS3: .../src/com/sulake/habbo/navigator/view/RoomInfoPopup.as::set roomIsHome()
    private set roomIsHome(value: boolean)
    {
        this._homeOverridden = true;
        this._homeOverrideValue = value;
    }

    // AS3: .../src/com/sulake/habbo/navigator/view/RoomInfoPopup.as::get roomIsFavorite()
    private get roomIsFavorite(): boolean
    {
        if(this._favoriteOverridden)
        {
            return this._favoriteOverrideValue;
        }

        return this._navigator.legacyNavigator.isRoomFavorite(this._roomData!.flatId);
    }

    // AS3: .../src/com/sulake/habbo/navigator/view/RoomInfoPopup.as::set roomIsFavorite()
    private set roomIsFavorite(value: boolean)
    {
        this._favoriteOverridden = true;
        this._favoriteOverrideValue = value;
    }

    /**
	 * Populate the popup window with room data.
	 *
	 * @see sources/win63_version/habbo/navigator/view/RoomInfoPopup.as populate()
	 */
    // AS3: .../src/com/sulake/habbo/navigator/view/RoomInfoPopup.as::populate()
    private populate(): void
    {
        if(this._roomData === null || !this._window) return;

        const mainContent = this._window.findChildByName('main_content') as IItemListWindow | null;
        const headerContent = this._window.findChildByName('header_content') as IItemListWindow | null;
        const bottomItemlist = this._window.findChildByName('bottom_itemlist') as IItemListWindow | null;

        // Owner region
        const ownerRegion = this._window.findChildByName('room_owner_region');

        if(ownerRegion)
        {
            ownerRegion.visible = this._roomData.showOwner;
            ownerRegion.id = this._roomData.ownerId;
            ownerRegion.procedure = this.ownerLinkProcedure;
        }

        // Group region
        const groupRegion = this._window.findChildByName('room_group_region');

        if(groupRegion)
        {
            groupRegion.visible = this._roomData.groupBadgeCode !== '';
        }

        // Room name, description, owner name
        const roomName = this._window.findChildByName('room_name');

        if(roomName)
        {
            roomName.caption = this._roomData.roomName;
        }

        const roomDesc = this._window.findChildByName('room_desc');

        if(roomDesc)
        {
            roomDesc.caption = this._roomData.description;
        }

        const ownerName = this._window.findChildByName('owner_name');

        if(ownerName)
        {
            ownerName.caption = this._roomData.ownerName;
        }

        // Favorite region
        const favoriteRegion = this._window.findChildByName('favorite_region');

        if(favoriteRegion)
        {
            favoriteRegion.procedure = this.roomFavoriteRegionProcedure;
        }

        // Home region
        const homeRegion = this._window.findChildByName('home_region');

        if(homeRegion)
        {
            homeRegion.procedure = this.homeRoomRegionProcedure;
        }

        // Settings region
        const settingsRegion = this._window.findChildByName('settings_region');

        if(settingsRegion)
        {
            settingsRegion.procedure = this.settingsRegionProcedure;
        }

        // Settings container visibility
        const settingsContainer = this._window.findChildByName('settings_container');
        const currentUserName = this._navigator.getCurrentUserName();

        if(settingsContainer)
        {
            settingsContainer.visible = this._roomData.ownerName === currentUserName;
        }

        // Report region
        const reportEnabled = this._navigator.getBoolean('room.report.enabled');
        const reportRegion = this._window.findChildByName('report_region');
        const reportContainer = this._window.findChildByName('report_container');

        if(reportEnabled && this._roomData.ownerName !== currentUserName)
        {
            if(reportRegion)
            {
                reportRegion.id = this._roomData.ownerId;
                reportRegion.procedure = this.reportRegionProcedure;
                reportRegion.visible = true;
            }

            if(reportContainer)
            {
                reportContainer.visible = true;
            }
        }
        else
        {
            if(reportRegion)
            {
                reportRegion.visible = false;
            }

            if(reportContainer)
            {
                reportContainer.visible = false;
            }
        }

        // Arrange mid-bottom item list
        const midBottomItemlist = this._window.findChildByName('midBottom_itemlist') as IItemListWindow | null;

        if(midBottomItemlist)
        {
            midBottomItemlist.arrangeItems();
        }

        // Favorite/home icons
        const favoriteIcon = this._window.findChildByName('favorite_icon') as unknown as IStaticBitmapWrapperWindow | null;

        if(favoriteIcon)
        {
            favoriteIcon.assetUri = 'newnavigator_icon_fav_' + (this.roomIsFavorite ? 'yes' : 'no');
        }

        const homeIcon = this._window.findChildByName('home_icon') as unknown as IStaticBitmapWrapperWindow | null;

        if(homeIcon)
        {
            homeIcon.assetUri = 'newnavigator_icon_home_' + (this.roomIsHome ? 'yes' : 'no');
        }

        // Group badge
        const hasGroup = this._roomData.groupBadgeCode !== '';
        const groupBadge = this._window.findChildByName('room_group_badge');

        if(groupBadge)
        {
            groupBadge.visible = hasGroup;
        }

        if(ownerRegion)
        {
            ownerRegion.visible = this._roomData.showOwner;
        }

        if(groupRegion)
        {
            groupRegion.visible = hasGroup;
        }

        const groupOwnerContainer = this._window.findChildByName('room_group_owner_container');

        if(groupOwnerContainer)
        {
            groupOwnerContainer.visible = hasGroup || this._roomData.showOwner;
        }

        if(hasGroup)
        {
            const groupBadgeWidget = (this._window.findChildByName('room_group_badge') as IWidgetWindow | null)?.widget as IBadgeImageWidget | null;

            if(groupBadgeWidget)
            {
                groupBadgeWidget.badgeId = this._roomData.groupBadgeCode;
            }

            const groupNameEl = this._window.findChildByName('group_name');

            if(groupNameEl)
            {
                groupNameEl.caption = this._roomData.groupName;
                groupNameEl.id = this._roomData.habboGroupId;
            }

            if(groupRegion)
            {
                groupRegion.id = this._roomData.habboGroupId;
                groupRegion.procedure = this.groupLinkProcedure;
            }

            // Group details icons (admin/size/furnish) — depends on cached group details
            const groupDetails = this._navigator.getCachedGroupDetails(this._roomData.habboGroupId) as {
                isOwner?: boolean;
                isAdmin?: boolean;
                type?: number;
                membersCanDecorate?: boolean;
            } | null;

            if(groupDetails)
            {
                const groupModeAdmin = this._window.findChildByName('group_mode_admin') as unknown as IStaticBitmapWrapperWindow | null;

                if(groupModeAdmin)
                {
                    if(groupDetails.isOwner)
                    {
                        groupModeAdmin.assetUri = 'newnavigator_icon_group_owner';
                    }
                    else if(groupDetails.isAdmin)
                    {
                        groupModeAdmin.assetUri = 'newnavigator_icon_group_admin';
                    }
                    else
                    {
                        groupModeAdmin.assetUri = '';
                    }
                }

                const groupModeSize = this._window.findChildByName('group_mode_size') as unknown as IStaticBitmapWrapperWindow | null;

                if(groupModeSize)
                {
                    groupModeSize.assetUri = this._navigator.getProperty('image.library.url') + 'guilds/grouptype_icon_' + (groupDetails.type ?? 0) + '.png';
                }

                const groupModeFurnish = this._window.findChildByName('group_mode_furnish') as unknown as IStaticBitmapWrapperWindow | null;

                if(groupModeFurnish)
                {
                    groupModeFurnish.assetUri = groupDetails.membersCanDecorate
                        ? this._navigator.getProperty('image.library.url') + 'guilds/group_decorate_icon.png'
                        : '';
                }
            }
        }
        else
        {
            const groupModeAdmin = this._window.findChildByName('group_mode_admin') as unknown as IStaticBitmapWrapperWindow | null;
            const groupModeSize = this._window.findChildByName('group_mode_size') as unknown as IStaticBitmapWrapperWindow | null;
            const groupModeFurnish = this._window.findChildByName('group_mode_furnish') as unknown as IStaticBitmapWrapperWindow | null;

            if(groupModeAdmin) groupModeAdmin.assetUri = '';
            if(groupModeSize) groupModeSize.assetUri = '';
            if(groupModeFurnish) groupModeFurnish.assetUri = '';
        }

        // Event info
        const hasEvent = this._roomData.roomAdExpiresInMin > 0;

        if(hasEvent)
        {
            const eventName = this._navigator.getLocalization('navigator.eventsettings.name') + ': ' + this._roomData.roomAdName;
            let eventDesc = this._navigator.getLocalization('navigator.eventsettings.desc') + ': ' + this._roomData.roomAdDescription + '\n';

            eventDesc += this._navigator.getLocalization('roomad.event.expiration_time') + FriendlyTime.getFriendlyTime(this._navigator.localization, this._roomData.roomAdExpiresInMin * 60);

            const eventNameEl = this._window.findChildByName('event_name');

            if(eventNameEl)
            {
                eventNameEl.caption = eventName;
            }

            const eventDescEl = this._window.findChildByName('event_desc');

            if(eventDescEl)
            {
                eventDescEl.caption = eventDesc;
            }
        }

        if(bottomItemlist)
        {
            const eventInfo = bottomItemlist.getListItemByName('event_info');

            if(eventInfo)
            {
                eventInfo.visible = hasEvent;
            }
        }

        if(headerContent)
        {
            headerContent.arrangeItems();
        }

        // Tags
        this._tags = [];
        const tagList = this._window.findChildByName('tag_list') as IItemListWindow | null;

        if(tagList)
        {
            tagList.destroyListItems();

            for(let i = 0; i < this._roomData.tags.length; i++)
            {
                this._tags.push(this._roomData.tags[i]);
                tagList.addListItem(this.getNewTagItem(this._roomData.tags[i], i));
            }
        }

        // Properties
        this.clearProperties();
        this.addProperty('properties', this._navigator.getLocalization('navigator.roompopup.property.trading', 'Trading'), getLocalizationKey(this._roomData.tradeMode));

        if(this._navigator.getBoolean('room.ranking.enabled'))
        {
            this.addProperty('properties', this._navigator.getLocalization('navigator.roompopup.property.ranking', 'Ranking'), this._roomData.ranking.toString());
        }

        this.addProperty('properties', this._navigator.getLocalization('navigator.roompopup.property.max_users', 'Max users'), this._roomData.maxUserCount.toString());

        // Room thumbnail
        const roomThumbnail = this._window.findChildByName('room_thumbnail') as unknown as IStaticBitmapWrapperWindow | null;

        if(roomThumbnail)
        {
            roomThumbnail.assetUri = 'newnavigator_default_room';

            if(this._navigator.isPerkAllowed(PerkType.NAVIGATOR_ROOM_THUMBNAIL_CAMERA))
            {
                if(this._roomData.officialRoomPicRef != null)
                {
                    if(this._navigator.getBoolean('new.navigator.official.room.thumbnails.in.amazon'))
                    {
                        roomThumbnail.assetUri = this._navigator.getProperty('navigator.thumbnail.url_base') + this._roomData.flatId + '.png';
                    }
                    else
                    {
                        roomThumbnail.assetUri = this._navigator.getProperty('image.library.url') + this._roomData.officialRoomPicRef;
                    }
                }
                else
                {
                    roomThumbnail.assetUri = this._navigator.getProperty('navigator.thumbnail.url_base') + this._roomData.flatId + '.png';
                }
            }
        }

        if(bottomItemlist)
        {
            bottomItemlist.arrangeItems();
        }

        if(mainContent)
        {
            mainContent.arrangeItems();
        }
    }

    /**
	 * Clear the properties item list.
	 *
	 * @see sources/win63_version/habbo/navigator/view/RoomInfoPopup.as clearProperties()
	 */
    // AS3: .../src/com/sulake/habbo/navigator/view/RoomInfoPopup.as::clearProperties()
    private clearProperties(): void
    {
        if(!this._window) return;

        const properties = this._window.findChildByName('properties') as IItemListWindow | null;

        if(properties)
        {
            properties.destroyListItems();
        }
    }

    /**
	 * Add a property name/value pair to the properties list.
	 *
	 * @param listName - The name of the item list to add to
	 * @param name - The property display name
	 * @param value - The property display value
	 *
	 * @see sources/win63_version/habbo/navigator/view/RoomInfoPopup.as addProperty()
	 */
    // AS3: .../src/com/sulake/habbo/navigator/view/RoomInfoPopup.as::addProperty()
    private addProperty(listName: string, name: string, value: string): void
    {
        if(!this._window) return;

        const list = this._window.findChildByName(listName) as IItemListWindow | null;

        if(!list) return;

        const windowManager = this._navigator.windowManager;

        if(!windowManager) return;

        const propertyWindow = windowManager.buildWidgetLayout('property_xml') as IWindowContainer | null;

        if(!propertyWindow) return;

        const nameEl = propertyWindow.findChildByName('property_name');

        if(nameEl)
        {
            nameEl.caption = name;
        }

        const valueEl = propertyWindow.findChildByName('property_value');

        if(valueEl)
        {
            valueEl.caption = value;
        }

        list.addListItem(propertyWindow as unknown as IWindow);
    }

    /**
	 * Create a new tag item element.
	 *
	 * @param tag - The tag text
	 * @param index - The tag index (used as ID for click handling)
	 * @returns The tag window element
	 *
	 * @see sources/win63_version/habbo/navigator/view/RoomInfoPopup.as getNewTagItem()
	 */
    // AS3: .../src/com/sulake/habbo/navigator/view/RoomInfoPopup.as::getNewTagItem()
    private getNewTagItem(tag: string, index: number): IWindow
    {
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/view/RoomInfoPopup.as::getNewTagItem()
        // uses assets.getAssetByName("tag_xml") - not "navigator_tag".
        const windowManager = this._navigator.windowManager;
        const tagWindow = windowManager?.buildWidgetLayout('tag_xml') as IWindowContainer | null;

        if(tagWindow)
        {
            const tagRegion = tagWindow.findChildByName('tag_region') as IWindowContainer | null;

            if(tagRegion)
            {
                tagRegion.id = index;
                tagRegion.procedure = this.tagRegionProcedure;

                const tagText = tagRegion.findChildByName('tag_text');

                if(tagText)
                {
                    tagText.caption = '#' + tag;
                }

                return tagRegion as unknown as IWindow;
            }
        }

        return tagWindow as unknown as IWindow;
    }

    // AS3: .../src/com/sulake/habbo/navigator/view/RoomInfoPopup.as::createWindow()
    private createWindow(): void
    {
        const windowManager = this._navigator.windowManager;

        if(!windowManager) return;

        const built = windowManager.buildWidgetLayout('room_info_popup_bubble_xml');

        if(built)
        {
            this._window = built as IWindowContainer;
        }
    }

    // AS3: .../src/com/sulake/habbo/navigator/view/RoomInfoPopup.as::destroy()
    private destroy(): void
    {
        if(this._window)
        {
            this._window.destroy();
        }

        this._window = null;
    }

    /**
	 * Click handler for the owner name link.
	 *
	 * @see sources/win63_version/habbo/navigator/view/RoomInfoPopup.as ownerLinkProcedure()
	 */
    private ownerLinkProcedure = (event: WindowEvent, window: IWindow): void =>
    {
        if(event.type === 'WME_CLICK')
        {
            this._navigator.getExtendedProfile(window.id);
            this.destroy();
        }
    };

    /**
	 * Click handler for the group name link.
	 *
	 * @see sources/win63_version/habbo/navigator/view/RoomInfoPopup.as groupLinkProcedure()
	 */
    private groupLinkProcedure = (event: WindowEvent, window: IWindow): void =>
    {
        if(event.type === 'WME_CLICK')
        {
            this._navigator.getGuildInfo(window.id);
            this.destroy();
        }
    };

    /**
	 * Click handler for the report button.
	 *
	 * @see sources/win63_version/habbo/navigator/view/RoomInfoPopup.as reportRegionProcedure()
	 */
    private reportRegionProcedure = (event: WindowEvent, _window: IWindow): void =>
    {
        if(event.type === 'WME_CLICK' && this._roomData)
        {
            const help = (this._navigator.legacyNavigator as unknown as { habboHelp?: { reportRoom: (roomId: number, roomName: string, roomDescription: string) => void } | null }).habboHelp;

            help?.reportRoom(this._roomData.flatId, this._roomData.roomName, this._roomData.description);
            this.destroy();
        }
    };

    /**
	 * Click handler for a tag.
	 *
	 * @see sources/win63_version/habbo/navigator/view/RoomInfoPopup.as tagRegionProcedure()
	 */
    private tagRegionProcedure = (event: WindowEvent, window: IWindow): void =>
    {
        if(event.type === 'WME_CLICK')
        {
            this._navigator.performTagSearch(this._tags[window.id]);
            this.destroy();
        }
    };

    /**
	 * Click handler for the settings button.
	 *
	 * @see sources/win63_version/habbo/navigator/view/RoomInfoPopup.as settingsRegionProcedure()
	 */
    private settingsRegionProcedure = (event: WindowEvent, _window: IWindow): void =>
    {
        if(event.type === 'WME_CLICK')
        {
            const legacy = this._navigator.legacyNavigator as LegacyNavigator;

            if(legacy.roomSettingsCtrl && this._roomData)
            {
                legacy.roomSettingsCtrl.startRoomSettingsEditFromNavigator(this._roomData.flatId, this._roomData.habboGroupId);
            }

            this.destroy();
        }
    };

    /**
	 * Click handler for the favorite toggle.
	 *
	 * @see sources/win63_version/habbo/navigator/view/RoomInfoPopup.as roomFavoriteRegionProcedure()
	 */
    private roomFavoriteRegionProcedure = (event: WindowEvent, _window: IWindow): void =>
    {
        if(event.type === 'WME_CLICK' && this._roomData)
        {
            if(!this.roomIsFavorite)
            {
                this._navigator.communication.connection?.send(new AddFavouriteRoomMessageComposer(this._roomData.flatId));
                this.roomIsFavorite = true;
            }
            else
            {
                this._navigator.communication.connection?.send(new DeleteFavouriteRoomMessageComposer(this._roomData.flatId));
                this.roomIsFavorite = false;
            }

            const favoriteIcon = this._window?.findChildByName('favorite_icon') as unknown as IStaticBitmapWrapperWindow | null;

            if(favoriteIcon)
            {
                favoriteIcon.assetUri = 'newnavigator_icon_fav_' + (this.roomIsFavorite ? 'yes' : 'no');
            }
        }
    };

    /**
	 * Click handler for the home room toggle.
	 *
	 * @see sources/win63_version/habbo/navigator/view/RoomInfoPopup.as homeRoomRegionProcedure()
	 */
    private homeRoomRegionProcedure = (event: WindowEvent, _window: IWindow): void =>
    {
        if(event.type === 'WME_CLICK' && this._roomData)
        {
            if(!this.roomIsHome)
            {
                this._navigator.communication.connection?.send(new UpdateHomeRoomMessageComposer(this._roomData.flatId));
                this.roomIsHome = true;
            }

            const homeIcon = this._window?.findChildByName('home_icon') as unknown as IStaticBitmapWrapperWindow | null;

            if(homeIcon)
            {
                homeIcon.assetUri = 'newnavigator_icon_home_' + (this.roomIsHome ? 'yes' : 'no');
            }
        }
    };
}
