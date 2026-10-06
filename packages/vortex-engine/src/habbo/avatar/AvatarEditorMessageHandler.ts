import type {IConnection} from '@core/communication/connection/IConnection';
import type {IMessageEvent} from '@core/communication/messages/IMessageEvent';
import type {HabboAvatarEditor} from './HabboAvatarEditor';
import type {IAvatarEditorMessageHandler} from './IAvatarEditorMessageHandler';
import type {IOutfit} from './IOutfit';
import {AvatarEditorIdEnum} from './enum/AvatarEditorIdEnum';
import {AvatarEffectActivatedMessageEvent} from '@habbo/communication/messages/incoming/inventory/AvatarEffectActivatedMessageEvent';
import {AvatarEffectAddedMessageEvent} from '@habbo/communication/messages/incoming/inventory/AvatarEffectAddedMessageEvent';
import {AvatarEffectExpiredMessageEvent} from '@habbo/communication/messages/incoming/inventory/AvatarEffectExpiredMessageEvent';
import {AvatarEffectMessageEvent} from '@habbo/communication/messages/incoming/room/action/AvatarEffectMessageEvent';
import {AvatarEffectSelectedMessageEvent} from '@habbo/communication/messages/incoming/wardrobe/AvatarEffectSelectedMessageEvent';
import type {CheckUserNameResultMessageParser} from '@habbo/communication/messages/parser/help/CheckUserNameResultMessageParser';
import {CheckUserNameResultMessageEvent} from '@habbo/communication/messages/incoming/help/CheckUserNameResultMessageEvent';
import {UserRightsMessageEvent} from '@habbo/communication/messages/incoming/handshake/UserRightsMessageEvent';
import {WardrobeMessageEvent} from '@habbo/communication/messages/incoming/wardrobe/WardrobeMessageEvent';
import {CheckUserNameMessageComposer} from '@habbo/communication/messages/outgoing/help/CheckUserNameMessageComposer';
import {GetWardrobeMessageComposer} from '@habbo/communication/messages/outgoing/wardrobe/GetWardrobeMessageComposer';
import {SaveWardrobeOutfitMessageComposer} from '@habbo/communication/messages/outgoing/wardrobe/SaveWardrobeOutfitMessageComposer';

/**
 * The editor's network side: eight incoming messages and three requests.
 *
 * **Every** incoming handler looks the editor up by `AvatarEditorIdEnum.MAIN_EDITOR` and does
 * nothing if it is absent — so an effect push while the furniture editor is open, and the main one
 * is not, is silently dropped. That is AS3's, and it is why the editor must exist before any of
 * this matters.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/AvatarEditorMessageHandler.as
 */
export class AvatarEditorMessageHandler implements IAvatarEditorMessageHandler
{
    // AS3: .../avatar/AvatarEditorMessageHandler.as::NAME_OK
    // Name DERIVED: `_SafeCls_2167._SafeStr_6694`, the result code a free name comes back with.
    private static readonly NAME_OK: number = 0;

    // AS3: .../avatar/AvatarEditorMessageHandler.as::_connection
    // AS3 holds the whole communication manager and uses only its connection.
    private _connection: IConnection | null;

    // AS3: .../avatar/AvatarEditorMessageHandler.as::_manager
    // Name DERIVED (`_SafeStr_4593`).
    private _manager: {getEditor(editorId: number): HabboAvatarEditor | null; readonly ownUserRoomId: number} | null;

    // TS-only: kept so `dispose()` can unregister. AS3 never unregisters — see `dispose()`.
    private _events: IMessageEvent[] = [];

    // AS3: .../avatar/AvatarEditorMessageHandler.as::AvatarEditorMessageHandler()
    constructor(manager: {getEditor(editorId: number): HabboAvatarEditor | null; readonly ownUserRoomId: number}, connection: IConnection | null)
    {
        this._manager = manager;
        this._connection = connection;

        this.register(new AvatarEffectMessageEvent(this.onRoomAvatarEffects));
        this.register(new AvatarEffectAddedMessageEvent(this.onAvatarEffectAdded));
        this.register(new UserRightsMessageEvent(this.onUserRights));
        this.register(new WardrobeMessageEvent(this.onWardrobe));
        this.register(new AvatarEffectSelectedMessageEvent(this.onAvatarEffectSelected));
        this.register(new AvatarEffectExpiredMessageEvent(this.onAvatarEffectExpired));
        this.register(new CheckUserNameResultMessageEvent(this.onCheckUserNameResult));
        this.register(new AvatarEffectActivatedMessageEvent(this.onAvatarEffectActivated));
    }

    // AS3: .../avatar/AvatarEditorMessageHandler.as::saveWardrobeOutfit()
    // AS3 disposes the composer after sending; this port's connection does not take ownership, so
    // there is nothing to dispose.
    public saveWardrobeOutfit(slotId: number, outfit: IOutfit): void
    {
        this._connection?.send(new SaveWardrobeOutfitMessageComposer(slotId, outfit.figure, outfit.gender));
    }

    // AS3: .../avatar/AvatarEditorMessageHandler.as::getWardrobe()
    public getWardrobe(): void
    {
        this._connection?.send(new GetWardrobeMessageComposer());
    }

    // AS3: .../avatar/AvatarEditorMessageHandler.as::checkName()
    public checkName(name: string): void
    {
        this._connection?.send(new CheckUserNameMessageComposer(name));
    }

    /**
     * AS3 nulls its two fields and **leaves all eight message events registered** on the
     * connection — a leak, and one that keeps firing into a null manager afterwards. Every handler
     * null-checks the manager first, so nothing throws; unregistering here anyway, because the
     * port's connection exposes `removeMessageEvent` and a live listener into a disposed handler
     * has no upside.
     */
    // AS3: .../avatar/AvatarEditorMessageHandler.as::dispose()
    public dispose(): void
    {
        for(const event of this._events) this._connection?.removeMessageEvent(event);

        this._events = [];
        this._connection = null;
        this._manager = null;
    }

    // TS-only: AS3 repeats `addHabboConnectionMessageEvent(new X(cb))` eight times inline.
    private register(event: IMessageEvent): void
    {
        this._connection?.addMessageEvent(event);
        this._events.push(event);
    }

    // TS-only: every handler below begins with this same lookup.
    private get editor(): HabboAvatarEditor | null
    {
        return this._manager?.getEditor(AvatarEditorIdEnum.MAIN_EDITOR) ?? null;
    }

    /**
     * AS3: .../avatar/AvatarEditorMessageHandler.as::onCheckUserNameResult()
     *
     * Routed at the **dialog**, not at the editor — and dropped when it has never been opened,
     * which is the usual case: the rename dialog is built lazily on its first click.
     */
    // AS3: .../avatar/AvatarEditorMessageHandler.as::onCheckUserNameResult()
    private onCheckUserNameResult = (rawEvent: IMessageEvent): void =>
    {
        const dialog = this.editor?.view?.avatarEditorNameChangeView ?? null;

        if(dialog === null) return;

        const parser = (rawEvent as CheckUserNameResultMessageEvent).getParser() as CheckUserNameResultMessageParser | null;

        if(parser === null) return;

        if(parser.resultCode === AvatarEditorMessageHandler.NAME_OK) dialog.checkedName = parser.name;
        else dialog.setNameNotAvailableView(parser.resultCode, parser.name, parser.nameSuggestions);
    };

    // AS3: .../avatar/AvatarEditorMessageHandler.as::onWardrobe()
    private onWardrobe = (rawEvent: IMessageEvent): void =>
    {
        const event = rawEvent as WardrobeMessageEvent;

        // Null until the panel has been opened once — `get wardrobe()` gates on the editor's own
        // `_initialised`. AS3 dereferences it unguarded and would throw; the answer is simply
        // dropped here, and the panel re-requests it when it is next built.
        this.editor?.wardrobe?.updateSlots(event.state, event.outfits);
    };

    /**
     * Maps the club level to **2 or 0** — not to the level itself. Any non-zero club makes the
     * editor treat the user as a full subscriber.
     */
    // AS3: .../avatar/AvatarEditorMessageHandler.as::onUserRights()
    private onUserRights = (event: IMessageEvent): void =>
    {
        const editor = this.editor;

        if(editor === null) return;

        const clubLevel = ((event as {parser?: unknown}).parser as {clubLevel?: number} | null)?.clubLevel ?? 0;

        editor.clubMemberLevel = clubLevel !== 0 ? 2 : 0;
        editor.update();
    };

    // AS3: .../avatar/AvatarEditorMessageHandler.as::onAvatarEffectAdded()
    // Only resets the effects page — the new effect is not selected.
    private onAvatarEffectAdded = (): void =>
    {
        this.editor?.effects?.reset();
    };

    // AS3: .../avatar/AvatarEditorMessageHandler.as::onAvatarEffectActivated()
    private onAvatarEffectActivated = (event: IMessageEvent): void =>
    {
        const editor = this.editor;

        if(editor === null) return;

        editor.effects?.reset();

        const type = ((event as {parser?: unknown}).parser as {type?: number} | null)?.type ?? -1;

        if(editor.figureData === null) return;

        editor.figureData.avatarEffectType = type;
        editor.figureData.updateView();
    };

    // AS3: .../avatar/AvatarEditorMessageHandler.as::onAvatarEffectExpired()
    // Clears the worn effect **only if it is the one that expired**.
    private onAvatarEffectExpired = (event: IMessageEvent): void =>
    {
        const editor = this.editor;

        if(editor === null) return;

        editor.effects?.reset();

        const type = ((event as {parser?: unknown}).parser as {type?: number} | null)?.type ?? -1;
        const figureData = editor.figureData;

        if(figureData === null || figureData.avatarEffectType !== type) return;

        figureData.avatarEffectType = -1;
        figureData.updateView();
    };

    /**
     * Somebody in the room switched an effect on.
     *
     * The guard is the whole method: this message is broadcast for *every* avatar in the room, and
     * only the local user's own effect belongs in the editor's preview. `userId` here is a room
     * index, not a web id, which is why it is compared against `ownUserRoomId`.
     */
    // AS3: .../avatar/AvatarEditorMessageHandler.as::onRoomAvatarEffects()
    private onRoomAvatarEffects = (event: IMessageEvent): void =>
    {
        const editor = this.editor;

        if(editor === null || editor.figureData === null) return;

        const parser = (event as {parser?: unknown}).parser as {userId?: number; effectId?: number} | null;

        if(parser == null) return;

        const ownUserRoomId = this._manager?.ownUserRoomId ?? -1;

        if(ownUserRoomId < 0 || parser.userId !== ownUserRoomId) return;

        editor.figureData.avatarEffectType = parser.effectId ?? -1;
        editor.figureData.updateView();
    };

    // AS3: .../avatar/AvatarEditorMessageHandler.as::onAvatarEffectSelected()
    // No `effects.reset()` here, unlike the activated and expired handlers.
    private onAvatarEffectSelected = (event: IMessageEvent): void =>
    {
        const figureData = this.editor?.figureData ?? null;

        if(figureData === null) return;

        figureData.avatarEffectType = ((event as {parser?: unknown}).parser as {type?: number} | null)?.type ?? -1;
        figureData.updateView();
    };
}
