import type {IActionDefinition} from './IActionDefinition';

/**
 * Interface for active avatar action data.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/actions/IActiveActionData.as (IActiveActionData)
 */
export interface IActiveActionData
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/actions/IActiveActionData.as::get id()
    readonly id: string;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/actions/IActiveActionData.as::get actionType()
    readonly actionType: string;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/actions/IActiveActionData.as::get actionParameter()
    actionParameter: string;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/actions/IActiveActionData.as::get startFrame()
    readonly startFrame: number;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/actions/IActiveActionData.as::get definition()
    definition: IActionDefinition;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/actions/IActiveActionData.as::get overridingAction()
    overridingAction: string;
}
