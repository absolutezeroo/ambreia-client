/**
 * IExpressionAddition
 *
 * Extended interface for expression-based avatar additions.
 * Adds a type property to identify the expression kind.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/additions/IExpressionAddition.as
 */
import type {IAvatarAddition} from './IAvatarAddition';

export interface IExpressionAddition extends IAvatarAddition {
    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/additions/IExpressionAddition.as::get type()
    readonly type: number;
}
