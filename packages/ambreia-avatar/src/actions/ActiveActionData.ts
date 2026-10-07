import type {IActionDefinition} from './IActionDefinition';
import type {IActiveActionData} from './IActiveActionData';

/**
 * Represents an active action being applied to an avatar.
 * Holds the action type, parameter, and associated definition.
 *
 * @see sources/win63_version/habbo/avatar/actions/ActiveActionData.as
 */
export class ActiveActionData implements IActiveActionData
{
    constructor(actionType: string, actionParameter: string = '', startFrame: number = 0)
    {
        this._actionType = actionType;
        this._actionParameter = actionParameter;
        this._startFrame = startFrame;
    }

    private _actionType: string;

    /**
	 * The action type identifier.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/ActiveActionData.as::get actionType()
    public get actionType(): string
    {
        return this._actionType;
    }

    private _actionParameter: string;

    /**
	 * The action parameter value.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/ActiveActionData.as::get actionParameter()
    public get actionParameter(): string
    {
        return this._actionParameter;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/ActiveActionData.as::set actionParameter()
    public set actionParameter(value: string)
    {
        this._actionParameter = value;
    }

    private _definition: IActionDefinition | null = null;

    /**
	 * The action definition associated with this active action.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/ActiveActionData.as::get definition()
    public get definition(): IActionDefinition
    {
        return this._definition!;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/ActiveActionData.as::set definition()
    public set definition(value: IActionDefinition)
    {
        this._definition = value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/ActiveActionData.as::_startFrame
    private _startFrame: number;

    /**
	 * The start frame for animation.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/ActiveActionData.as::get startFrame()
    public get startFrame(): number
    {
        return this._startFrame;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/ActiveActionData.as::_overridingAction
    private _overridingAction: string = '';

    /**
	 * An optional action that overrides this one.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/ActiveActionData.as::get overridingAction()
    public get overridingAction(): string
    {
        return this._overridingAction;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/ActiveActionData.as::set overridingAction()
    public set overridingAction(value: string)
    {
        this._overridingAction = value;
    }

    /**
	 * A composite identifier combining the definition id and action parameter.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/ActiveActionData.as::get id()
    public get id(): string
    {
        if(!this._definition) return '';

        return this._definition.id + '_' + this._actionParameter;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/ActiveActionData.as::toString()
    public toString(): string
    {
        return 'Action: ' + this._actionType + '  param: ' + this._actionParameter;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/ActiveActionData.as::dispose()
    public dispose(): void
    {
        this._definition = null;
    }
}
