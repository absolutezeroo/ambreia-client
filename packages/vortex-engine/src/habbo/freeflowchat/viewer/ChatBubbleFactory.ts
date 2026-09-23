import {Logger} from '@core/utils/Logger';
import type {IGetImageListener} from '@habbo/room/IGetImageListener';
import type {IAvatarImageListener} from '@habbo/avatar/IAvatarImageListener';
import {RoomSessionChatEvent} from '@habbo/session/events/RoomSessionChatEvent';
import type {IRoomSession} from '@habbo/session/IRoomSession';
import type {IHabboFreeFlowChat} from '../IHabboFreeFlowChat';
import {ChatItem} from '../data/ChatItem';
import type {IChatHistoryEntry} from '../history/visualization/entry/IChatHistoryEntry';
import {ChatHistoryEntryBitmapBubble} from '../history/visualization/entry/ChatHistoryEntryBitmapBubble';
import {ChatHistoryRoomChangeEntry, type IRoomChangeData} from '../history/visualization/entry/ChatHistoryRoomChangeEntry';
import {ChatStyleLibrary} from './visualization/style/ChatStyleLibrary';
import {ChatStyle} from './visualization/style/ChatStyle';
import {BlankStyle} from './visualization/style/BlankStyle';
import type {IChatStyleInternal} from './visualization/style/IChatStyleInternal';
import {PooledChatBubble} from './visualization/PooledChatBubble';
import {ChatBubble} from './visualization/ChatBubble';
import type {IUserData} from '@habbo/session/IUserData';
import {HabboFaceFocuser} from '@habbo/utils/HabboFaceFocuser';
import {PetFigureData} from '@habbo/avatar/pets/PetFigureData';
import {Vector3d} from '@room/utils/Vector3d';

const log = Logger.getLogger('habbo.freeflowchat.viewer.ChatBubbleFactory');

/**
 * ChatBubbleFactory
 *
 * Builds and pools the visible chat bubble (PooledChatBubble) and the
 * chat-history row (IChatHistoryEntry) for a ChatItem, resolving the
 * speaker's face image (avatar/pet), name, and the "special" system
 * messages (respect, handitem, mutetime, ping, pet events...) along the way.
 *
 * `getUserImage()` builds the bubble's avatar head-crop via
 * `avatarRenderManager.createAvatarImage()` + `HabboFaceFocuser.focusUserFace()`; `getPetImage()`
 * goes through `IRoomEngine.getPetImage()`, which answers synchronously for a cached pet and
 * through `imageReady()` otherwise. Both faces are cached per figure; the *disposable* bitmaps the
 * bubbles draw with are the ones trimmed at `MAX_DISPOSABLE_BITMAPS`.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/viewer/ChatBubbleFactory.as
 */
export class ChatBubbleFactory implements IGetImageListener, IAvatarImageListener
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/viewer/ChatBubbleFactory.as::MAX_DISPOSABLE_BITMAPS
    private static readonly MAX_DISPOSABLE_BITMAPS = 30;

    private _chatFlow: IHabboFreeFlowChat | null;
    private _chatStyleLibrary: ChatStyleLibrary | null = null;

    // AS3: .../src/com/sulake/habbo/freeflowchat/viewer/ChatBubbleFactory.as::_avatarImageCache
    private readonly _avatarImageCache: Map<string, ImageBitmap> = new Map();
    // AS3: .../src/com/sulake/habbo/freeflowchat/viewer/ChatBubbleFactory.as::_petImageCache
    private readonly _petImageCache: Map<string, ImageBitmap> = new Map();
    // AS3: .../src/com/sulake/habbo/freeflowchat/viewer/ChatBubbleFactory.as::_avatarColorCache
    private readonly _avatarColorCache: Map<string, number> = new Map();
    // AS3: .../src/com/sulake/habbo/freeflowchat/viewer/ChatBubbleFactory.as::_petImageIdToFigureString
    private readonly _petImageIdToFigureString: Map<number, string> = new Map();
    private readonly _disposableBitmaps: ImageBitmap[] = [];
    private _pool: PooledChatBubble[] = [];

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/viewer/ChatBubbleFactory.as::ChatBubbleFactory()
    constructor(chatFlow: IHabboFreeFlowChat)
    {
        this._chatFlow = chatFlow;

        if(chatFlow.assets)
        {
            this._chatStyleLibrary = new ChatStyleLibrary(chatFlow.assets);
        }
        else
        {
            log.warn('No asset library available - chat styles unavailable');
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/viewer/ChatBubbleFactory.as::dispose()
    dispose(): void
    {
        if(this.disposed) return;

        this.discardOldBitmaps();
        this._pool = [];
        this._chatStyleLibrary?.dispose();
        this._chatStyleLibrary = null;
        this._chatFlow = null;
    }

    // AS3: .../src/com/sulake/habbo/freeflowchat/viewer/ChatBubbleFactory.as::get disposed()
    get disposed(): boolean
    {
        return this._chatFlow === null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/viewer/ChatBubbleFactory.as::getNewChatBubble()
    getNewChatBubble(item: ChatItem, _isOwnChat: boolean = false): PooledChatBubble | null
    {
        if(!this._chatFlow) return null;

        const userData = this._chatFlow.roomSessionManager?.getSession(item.roomId)?.userDataManager.getUserDataByIndex(item.userId) ?? null;

        let name = '';

        if(item.forcedFigure || item.forcedUserName)
        {
            name = item.forcedUserName ?? '';
        }
        else if(userData)
        {
            name = userData.name;
        }

        this.applySpecialChatContent(item, name);

        const style: IChatStyleInternal = this._chatStyleLibrary?.getStyle(item.style) ?? new BlankStyle();
        const {face, color} = this.resolveFaceAndColor(item, style, userData, false);

        let bubble = this._pool.pop();

        if(!bubble)
        {
            bubble = new PooledChatBubble(this._chatFlow);
        }

        // AS3 saves/restores style.textFormat.color around recreate() — ChatStyle
        // instances are shared across every bubble of that style, and PooledChatBubble
        // temporarily reassigns textFormat.color while rendering this one bubble.
        const savedColor = style.textFormat.color;

        bubble.chatItem = item;
        bubble.style = style;
        bubble.face = face;
        bubble.recreate(name, item.forcedColor ? (item.forcedColor >>> 0) : color, this._chatFlow.roomChatBorderLimited);

        style.textFormat.color = savedColor;

        return bubble;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/viewer/ChatBubbleFactory.as::getNewEmptySpace()
    getNewEmptySpace(_chatType: number): PooledChatBubble | null
    {
        if(!this._chatFlow) return null;

        const style = new BlankStyle();
        // AS3 passes a null session here; ChatItem already guards `if(event.session)`.
        const event = new RoomSessionChatEvent(RoomSessionChatEvent.RSCE_CHAT_EVENT, null as unknown as IRoomSession, -1, '', 1, 0);
        const item = new ChatItem(event, performance.now());

        let bubble = this._pool.pop();

        if(!bubble)
        {
            bubble = new PooledChatBubble(this._chatFlow);
        }

        bubble.chatItem = item;
        bubble.style = style;
        bubble.face = null;
        bubble.recreate('', 0, false, 19);

        return bubble;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/viewer/ChatBubbleFactory.as::getHistoryLineEntry()
    // This was `async` while nothing called it. `ChatHistoryBuffer.insertChat()` does now, and it
    // must stay ordered: two lines said in the same frame would resolve in whatever order their
    // bitmaps decoded and land in the buffer that way round. `toImageBitmapSync()` bakes the same
    // picture with no await, so the row is appended before the next one is asked for.
    getHistoryLineEntry(item: ChatItem): IChatHistoryEntry | null
    {
        if(!this._chatFlow) return null;

        const userData = this._chatFlow.roomSessionManager?.getSession(item.roomId)?.userDataManager.getUserDataByIndex(item.userId) ?? null;

        let name = '';
        let webId = -1;
        let canIgnore = false;

        if(item.forcedFigure || item.forcedUserName)
        {
            name = item.forcedUserName ?? '';
        }
        else if(userData)
        {
            name = userData.name;
        }

        this.applySpecialChatContent(item, name);

        const style: IChatStyleInternal = this._chatStyleLibrary?.getStyle(item.style) ?? new BlankStyle();

        if(userData && !style.isNotification && userData.type === 1 && userData.webID > 0 && userData.webID !== this._chatFlow.sessionDataManager?.userId)
        {
            webId = userData.webID;
            canIgnore = true;
        }

        if(this.isSystemNotificationChat(item.chatType))
        {
            canIgnore = false;
        }

        const {face, color} = this.resolveFaceAndColor(item, style, userData, true);
        const chatBubble = new ChatBubble(item, style, face, name, item.forcedColor ? (item.forcedColor >>> 0) : color, this._chatFlow, 1);
        const bitmap = chatBubble.toImageBitmapSync();

        chatBubble.dispose();

        return new ChatHistoryEntryBitmapBubble(item, canIgnore, webId, name, bitmap, style.overlap);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/viewer/ChatBubbleFactory.as::getNewChatBubble()
    // and ::getHistoryLineEntry() resolve the face/color with *different* switches, not
    // identical logic: getNewChatBubble (history=false) images only users (type 1) and
    // pets (type 2, pet flag true); getHistoryLineEntry (history=true) also gives bots and
    // rentable bots (types 3/4) getUserImage, and builds pets with the pet flag false.
    private resolveFaceAndColor(item: ChatItem, style: IChatStyleInternal, userData: IUserData | null, history: boolean): {face: ImageBitmap | null; color: number}
    {
        let face: ImageBitmap | null = style instanceof ChatStyle ? style.iconImage : null;
        let color = 0;

        if(item.forcedFigure || item.forcedUserName)
        {
            if(!face) face = this.getUserImage(item.forcedFigure ?? '');
        }
        else if(userData)
        {
            const figure = userData.figure;

            color = this._avatarColorCache.get(figure) ?? 0;

            if(!face)
            {
                switch(userData.type - 1)
                {
                    case 0:
                        face = this.getUserImage(figure);
                        break;
                    case 1:
                    {
                        const roomObject = this._chatFlow?.roomEngine?.getRoomObject(item.roomId, userData.roomObjectId, 100) ?? null;
                        const posture = roomObject?.getModel().getString('figure_posture') ?? null;

                        // AS3 pet flag: true in getNewChatBubble, false in getHistoryLineEntry.
                        face = this.getPetImage(figure, 2, !history, 32, posture);
                        break;
                    }
                    case 2:
                    case 3:
                        // AS3 gives bots / rentable bots a user image only in the history switch.
                        if(history) face = this.getUserImage(figure);
                        break;
                }
            }
        }

        return {face, color};
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/viewer/ChatBubbleFactory.as::getHistoryRoomChangeEntry()
    getHistoryRoomChangeEntry(roomData: IRoomChangeData | null): IChatHistoryEntry
    {
        return new ChatHistoryRoomChangeEntry(roomData, this._chatFlow);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/viewer/ChatBubbleFactory.as::recycle()
    recycle(bubble: PooledChatBubble): void
    {
        this._pool.push(bubble);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/viewer/ChatBubbleFactory.as::getUserImage()
    getUserImage(figureString: string): ImageBitmap | null
    {
        let image = this._avatarImageCache.get(figureString) ?? null;

        if(!image)
        {
            const zoomEnabled = this._chatFlow?.getBoolean('zoom.enabled') ?? false;
            const avatarImage = this._chatFlow?.avatarRenderManager
                ?.createAvatarImage(figureString, zoomEnabled ? 'h' : 'sh', '', this, null) ?? null;

            if(avatarImage)
            {
                image = HabboFaceFocuser.focusUserFace(avatarImage, 'head', 2, zoomEnabled ? 0.5 : 1);

                const partColor = avatarImage.getPartColor('ch');

                avatarImage.dispose();

                if(partColor) this._avatarColorCache.set(figureString, partColor.rgb);
            }
        }

        if(image) this._avatarImageCache.set(figureString, image);

        return image;
    }

    /**
     * AS3 keys the cache on `figureString + posture` with no separator, and reads it back the same
     * way, so the concatenation is kept rather than made unambiguous.
     *
     * `sitting` is declared and never read in AS3 either - the caller varies `size` instead. Kept
     * so the signature matches, rather than dropped and silently diverging from the call sites.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/viewer/ChatBubbleFactory.as::getPetImage()
    private getPetImage(figureString: string, direction: number, _sitting: boolean, size: number = 64, posture: string | null = null): ImageBitmap | null
    {
        const cacheKey = figureString + posture;
        let image = this._petImageCache.get(cacheKey) ?? null;

        if(image == null)
        {
            const figureData = new PetFigureData(figureString);
            const typeId = figureData.typeId;

            // AS3 hard-codes 35 here; the value has no named constant in any tree.
            const fullImage = typeId === 35;

            const result = this._chatFlow?.roomEngine?.getPetImage(
                typeId,
                figureData.paletteId,
                figureData.color,
                new Vector3d(direction * 45),
                size,
                this,
                fullImage,
                0,
                figureData.customParts,
                posture
            ) ?? null;

            if(result != null)
            {
                image = result.data;

                if(result.id > 0)
                {
                    this._petImageIdToFigureString.set(result.id, figureData.figureString);
                }
            }

            this._avatarColorCache.set(figureString, figureData.color);
        }

        if(image != null)
        {
            this._petImageCache.set(cacheKey, image);
        }

        return image;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/viewer/ChatBubbleFactory.as::imageReady()
    imageReady(id: number, data: ImageBitmap | null): void
    {
        const figureString = this._petImageIdToFigureString.get(id);

        if(figureString !== undefined)
        {
            this._petImageIdToFigureString.delete(id);
            this.petImageReady(figureString);

            if(data)
            {
                this._petImageCache.set(figureString, data);
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/viewer/ChatBubbleFactory.as::imageFailed()
    imageFailed(_id: number): void
    {
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/viewer/ChatBubbleFactory.as::petImageReady()
    private petImageReady(figureString: string): void
    {
        const cached = this._petImageCache.get(figureString);

        if(cached)
        {
            this._petImageCache.delete(figureString);
            this._disposableBitmaps.push(cached);
        }

        if(this._disposableBitmaps.length > ChatBubbleFactory.MAX_DISPOSABLE_BITMAPS)
        {
            this.discardOldBitmaps();
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/viewer/ChatBubbleFactory.as::avatarImageReady()
    avatarImageReady(figureString: string): void
    {
        const cached = this._avatarImageCache.get(figureString);

        if(cached)
        {
            this._avatarImageCache.delete(figureString);
            this._disposableBitmaps.push(cached);
        }

        if(this._disposableBitmaps.length > ChatBubbleFactory.MAX_DISPOSABLE_BITMAPS)
        {
            this.discardOldBitmaps();
        }
    }

    // AS3: .../src/com/sulake/habbo/freeflowchat/viewer/ChatBubbleFactory.as::get chatStyleLibrary()
    get chatStyleLibrary(): ChatStyleLibrary | null
    {
        return this._chatStyleLibrary;
    }

    // DEVIATION: AS3 disposes every entry but never clears the array (only dispose() does), so
    //   past 30 every face update re-disposes a list that only grows. `BitmapData.dispose()` and
    //   `ImageBitmap.close()` are both no-ops the second time, so emptying it here changes nothing
    //   but the growing walk and the references it kept alive.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/viewer/ChatBubbleFactory.as::discardOldBitmaps()
    private discardOldBitmaps(): void
    {
        for(const bitmap of this._disposableBitmaps)
        {
            bitmap?.close();
        }

        this._disposableBitmaps.length = 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/viewer/ChatBubbleFactory.as::applySpecialChatContent()
    private applySpecialChatContent(item: ChatItem, name: string): void
    {
        if(item.chatType === 12)
        {
            switch(item.extraParam - 67)
            {
                case 0:
                    item.text = '<b>6666666...  77777777777777...</b>';
                    item.style = 1;
                    return;
            }
        }

        const localizations = this._chatFlow?.localizations;

        if(!localizations) return;

        if(item.chatType === 3)
        {
            item.text = localizations.getLocalizationWithParams('widgets.chatbubble.respect', '', 'username', name);
            return;
        }

        if(item.chatType === 4)
        {
            item.text = localizations.getLocalizationWithParams('widget.chatbubble.petrespect', '', 'petname', name);
            return;
        }

        if(item.chatType === 6)
        {
            item.text = localizations.getLocalizationWithParams('widget.chatbubble.pettreat', '', 'petname', name);
            return;
        }

        if(item.chatType === 11)
        {
            item.text = item.extraParam >= 0 ? `Ping: ${item.extraParam} ms` : 'Ping: measuring...';
            return;
        }

        if(item.chatType === 5)
        {
            const key = 'widget.chatbubble.handitem';
            const handItem = localizations.getLocalization(`handitem${item.extraParam}`, `handitem${item.extraParam}`);

            localizations.registerParameter(key, 'username', name);
            localizations.registerParameter(key, 'handitem', handItem);
            item.text = localizations.getLocalizationRaw(key)?.value ?? '';
            item.style = 1;
            return;
        }

        if(item.chatType === 10)
        {
            const key = 'widget.chatbubble.mutetime';
            const seconds = String(item.extraParam % 60);
            const minutes = String(item.extraParam > 0 ? Math.floor((item.extraParam % 3600) / 60) : 0);
            const hours = String(item.extraParam > 0 ? Math.floor(item.extraParam / 3600) : 0);

            localizations.registerParameter(key, 'hours', hours);
            localizations.registerParameter(key, 'minutes', minutes);
            localizations.registerParameter(key, 'seconds', seconds);
            item.text = localizations.getLocalizationRaw(key)?.value ?? '';
            item.style = 1;
            return;
        }

        if(item.chatType === 7 || item.chatType === 8 || item.chatType === 9)
        {
            let key = 'widget.chatbubble.petrevived';

            if(item.chatType === 8)
            {
                key = 'widget.chatbubble.petrefertilized';
            }
            else if(item.chatType === 9)
            {
                key = 'widget.chatbubble.petspeedfertilized';
            }

            localizations.registerParameter(key, 'petName', name);
            localizations.registerParameter(key, 'userName', this.resolveRoomUserName(item.roomId, item.extraParam));
            item.text = localizations.getLocalizationRaw(key)?.value ?? '';
            item.style = 1;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/viewer/ChatBubbleFactory.as::isSystemNotificationChat()
    private isSystemNotificationChat(chatType: number): boolean
    {
        switch(chatType - 3)
        {
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
            case 9:
                return true;
            default:
                return false;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/viewer/ChatBubbleFactory.as::resolveRoomUserName()
    private resolveRoomUserName(roomId: number, objectId: number): string
    {
        const roomObject = this._chatFlow?.roomEngine?.getRoomObject(roomId, objectId, 100) ?? null;

        if(!roomObject) return '';

        const userData = this._chatFlow?.roomSessionManager?.getSession(roomId)?.userDataManager.getUserDataByIndex(roomObject.getId()) ?? null;

        return userData?.name ?? '';
    }
}
