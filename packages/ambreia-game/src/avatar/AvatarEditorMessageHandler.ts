import type {IConnection} from '@ambreia/net/connection/IConnection';
import type {IMessageEvent} from '@ambreia/net/messages/IMessageEvent';
import type {HabboAvatarEditor} from './HabboAvatarEditor';
import type {IAvatarEditorMessageHandler} from './IAvatarEditorMessageHandler';
import {AvatarEditorIdEnum} from './enum/AvatarEditorIdEnum';
import type {CheckUserNameResultMessageParser} from '@ambreia/protocol/parser/help/CheckUserNameResultMessageParser';
import {CheckUserNameResultMessageEvent} from '@ambreia/protocol/incoming/help/CheckUserNameResultMessageEvent';
import {CheckUserNameMessageComposer} from '@ambreia/protocol/outgoing/help/CheckUserNameMessageComposer';

/**
 * Network bridge for the remaining avatar-editor operation: checking a character name.
 * Legacy wardrobe, HC-rights and owned-avatar-effect traffic was removed from the RPG client.
 */
export class AvatarEditorMessageHandler implements IAvatarEditorMessageHandler
{
    private static readonly NAME_OK: number = 0;

    private _connection: IConnection | null;
    private _manager: {getEditor(editorId: number): HabboAvatarEditor | null} | null;
    private _events: IMessageEvent[] = [];

    constructor(manager: {getEditor(editorId: number): HabboAvatarEditor | null}, connection: IConnection | null)
    {
        this._manager = manager;
        this._connection = connection;
        this.register(new CheckUserNameResultMessageEvent(this.onCheckUserNameResult));
    }

    public checkName(name: string): void
    {
        this._connection?.send(new CheckUserNameMessageComposer(name));
    }

    public dispose(): void
    {
        for(const event of this._events) this._connection?.removeMessageEvent(event);

        this._events = [];
        this._connection = null;
        this._manager = null;
    }

    private register(event: IMessageEvent): void
    {
        this._connection?.addMessageEvent(event);
        this._events.push(event);
    }

    private get editor(): HabboAvatarEditor | null
    {
        return this._manager?.getEditor(AvatarEditorIdEnum.MAIN_EDITOR) ?? null;
    }

    private onCheckUserNameResult = (rawEvent: IMessageEvent): void =>
    {
        const dialog = this.editor?.view?.avatarEditorNameChangeView ?? null;

        if(dialog === null) return;

        const parser = (rawEvent as CheckUserNameResultMessageEvent).getParser() as CheckUserNameResultMessageParser | null;

        if(parser === null) return;

        if(parser.resultCode === AvatarEditorMessageHandler.NAME_OK) dialog.checkedName = parser.name;
        else dialog.setNameNotAvailableView(parser.resultCode, parser.name, parser.nameSuggestions);
    };
}
