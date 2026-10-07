/**
 * ExpressionAdditionFactory
 *
 * Factory class for creating expression-based avatar additions by type.
 * Maps expression type IDs to their corresponding addition implementations.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/additions/ExpressionAdditionFactory.as
 */
import type {IExpressionAddition} from '../../avatar/visualization/additions/IExpressionAddition';
import type {AvatarVisualization} from '../../avatar/visualization/AvatarVisualization';
import {ExpressionAddition} from './ExpressionAddition';
import {FloatingHeart} from './FloatingHeart';

export class ExpressionAdditionFactory 
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/additions/ExpressionAdditionFactory.as::WAVE
    public static readonly WAVE: number = 1;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/additions/ExpressionAdditionFactory.as::BLOW
    public static readonly BLOW: number = 2;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/additions/ExpressionAdditionFactory.as::LAUGH
    public static readonly LAUGH: number = 3;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/additions/ExpressionAdditionFactory.as::CRY
    public static readonly CRY: number = 4;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/additions/ExpressionAdditionFactory.as::IDLE
    public static readonly IDLE: number = 5;

    /**
     * Creates the appropriate expression addition for the given type.
     *
     * @param id - The addition identifier
     * @param type - The expression type
     * @param visualization - The parent avatar visualization
     * @returns The created expression addition, or null if type is unknown
     */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/additions/ExpressionAdditionFactory.as::make()
    public static make(id: number, type: number, visualization: AvatarVisualization): IExpressionAddition | null 
    {
        switch(type) 
        {
            case ExpressionAdditionFactory.BLOW:
                return new FloatingHeart(id, ExpressionAdditionFactory.BLOW, visualization);
            default:
                return new ExpressionAddition(id, type, visualization);
        }
    }
}
