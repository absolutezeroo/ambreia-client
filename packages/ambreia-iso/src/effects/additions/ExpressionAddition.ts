/**
 * ExpressionAddition
 *
 * Base class for expression-based avatar additions. Provides default
 * no-op implementations of update and animate that subclasses can override.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/additions/ExpressionAddition.as
 */
import type {IRoomObjectSprite} from '../../object/visualization/IRoomObjectSprite';
import type {IExpressionAddition} from '../../avatar/visualization/additions/IExpressionAddition';
import type {AvatarVisualization} from '../../avatar/visualization/AvatarVisualization';

export class ExpressionAddition implements IExpressionAddition 
{
    protected _visualization: AvatarVisualization;

    constructor(id: number, type: number, visualization: AvatarVisualization) 
    {
        this._type = type;
        this._id = id;
        this._visualization = visualization;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/additions/ExpressionAddition.as::_id
    protected _id: number;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/additions/ExpressionAddition.as::get id()
    get id(): number 
    {
        return this._id;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/additions/ExpressionAddition.as::_type
    private _type: number = -1;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/additions/ExpressionAddition.as::get type()
    get type(): number 
    {
        return this._type;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/additions/ExpressionAddition.as::get disposed()
    get disposed(): boolean 
    {
        return this._visualization == null;
    }

    /**
     * Updates the expression addition (no-op in base class).
     *
     * @param sprite - The sprite to update
     * @param scale - The current visualization scale
     */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/additions/ExpressionAddition.as::update()
    update(_sprite: IRoomObjectSprite | null, _scale: number): void
    {
        // Override in subclasses
    }

    /**
     * Animates the expression addition (no-op in base class).
     *
     * @param sprite - The sprite to animate
     * @returns Always false in base class
     */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/additions/ExpressionAddition.as::animate()
    animate(_sprite: IRoomObjectSprite | null): boolean
    {
        return false;
    }

    /**
     * Disposes of this expression addition and releases references.
     */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/additions/ExpressionAddition.as::dispose()
    dispose(): void 
    {
        this._visualization = null!;
    }
}
