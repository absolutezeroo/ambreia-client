/**
 * Data class for moderation action definitions.
 *
 * @see source_as_win63/habbo/moderation/ModActionDefinition.as
 */
export class ModActionDefinitionData
{
    // AS3: .../src/com/sulake/habbo/moderation/ModActionDefinition.as::ALERT
    public static readonly ALERT: number = 1;
    // AS3: .../src/com/sulake/habbo/moderation/ModActionDefinition.as::MUTE
    public static readonly MUTE: number = 2;
    // AS3: .../src/com/sulake/habbo/moderation/ModActionDefinition.as::BAN
    public static readonly BAN: number = 3;
    // AS3: .../src/com/sulake/habbo/moderation/ModActionDefinition.as::KICK
    public static readonly KICK: number = 4;
    // AS3: .../src/com/sulake/habbo/moderation/ModActionDefinition.as::TRADING_LOCK
    public static readonly TRADING_LOCK: number = 5;
    // AS3: .../src/com/sulake/habbo/moderation/ModActionDefinition.as::MESSAGE
    public static readonly MESSAGE: number = 6;

    constructor(actionId: number, name: string, actionType: number, sanctionTypeId: number, actionLengthHours: number)
    {
        this._actionId = actionId;
        this._name = name;
        this._actionType = actionType;
        this._sanctionTypeId = sanctionTypeId;
        this._actionLengthHours = actionLengthHours;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/moderation/ModActionDefinition.as::_actionId
    private _actionId: number;

    // AS3: .../src/com/sulake/habbo/moderation/ModActionDefinition.as::get actionId()
    get actionId(): number
    {
        return this._actionId;
    }

    // AS3: .../src/com/sulake/habbo/moderation/ModActionDefinition.as::_name
    private _name: string;

    // AS3: .../src/com/sulake/habbo/moderation/ModActionDefinition.as::get name()
    get name(): string
    {
        return this._name;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/moderation/ModActionDefinition.as::_actionType
    private _actionType: number;

    // AS3: .../src/com/sulake/habbo/moderation/ModActionDefinition.as::get actionType()
    get actionType(): number
    {
        return this._actionType;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/moderation/ModActionDefinition.as::_sanctionTypeId
    private _sanctionTypeId: number;

    // AS3: .../src/com/sulake/habbo/moderation/ModActionDefinition.as::get sanctionTypeId()
    get sanctionTypeId(): number
    {
        return this._sanctionTypeId;
    }

    // AS3: .../src/com/sulake/habbo/moderation/ModActionDefinition.as::_actionLengthHours
    private _actionLengthHours: number;

    // AS3: .../src/com/sulake/habbo/moderation/ModActionDefinition.as::get actionLengthHours()
    get actionLengthHours(): number
    {
        return this._actionLengthHours;
    }
}
