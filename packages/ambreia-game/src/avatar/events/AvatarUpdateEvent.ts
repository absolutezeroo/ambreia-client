/**
 * "The user saved a new figure." Raised on the manager's own event bus by
 * `HabboAvatarEditor.saveCurrentSelection()`, so anything showing the user's avatar can refresh.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/events/AvatarUpdateEvent.as
 */
export class AvatarUpdateEvent
{
    // AS3: .../avatar/events/AvatarUpdateEvent.as::AVATAR_FIGURE_UPDATED
    public static readonly AVATAR_FIGURE_UPDATED: string = 'AVATAR_FIGURE_UPDATED';

    // AS3: .../avatar/events/AvatarUpdateEvent.as::_figure
    private readonly _figure: string;

    // AS3: .../avatar/events/AvatarUpdateEvent.as::AvatarUpdateEvent()
    constructor(figure: string)
    {
        this._figure = figure;
    }

    // TS-only: these events travel on an EventEmitter, which has no `type` of its own.
    public get type(): string
    {
        return AvatarUpdateEvent.AVATAR_FIGURE_UPDATED;
    }

    // AS3: .../avatar/events/AvatarUpdateEvent.as::get figure()
    public get figure(): string
    {
        return this._figure;
    }
}
