/**
 * User name update event
 *
 * @see source_as_win63/habbo/session/events/UserNameUpdateEvent.as
 */
export class UserNameUpdateEvent
{
    // AS3: .../src/com/sulake/habbo/session/events/UserNameUpdateEvent.as::NAME_UPDATE
    public static readonly NAME_UPDATE = 'unue_name_updated';

    constructor(name: string)
    {
        this._name = name;
    }

    // AS3: .../src/com/sulake/habbo/session/events/UserNameUpdateEvent.as::_name
    private _name: string;

    // AS3: .../src/com/sulake/habbo/session/events/UserNameUpdateEvent.as::get name()
    get name(): string
    {
        return this._name;
    }
}
