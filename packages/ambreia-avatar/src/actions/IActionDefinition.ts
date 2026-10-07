/**
 * Interface for an avatar action definition.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/actions/IActionDefinition.as (IActionDefinition)
 */
export interface IActionDefinition
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/actions/IActionDefinition.as::get id()
    readonly id: string;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/actions/IActionDefinition.as::get state()
    readonly state: string;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/actions/IActionDefinition.as::get precedence()
    readonly precedence: number;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/actions/IActionDefinition.as::get activePartSet()
    readonly activePartSet: string;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/actions/IActionDefinition.as::get isMain()
    readonly isMain: boolean;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/actions/IActionDefinition.as::get isDefault()
    readonly isDefault: boolean;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/actions/IActionDefinition.as::get assetPartDefinition()
    readonly assetPartDefinition: string;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/actions/IActionDefinition.as::get lay()
    readonly lay: string;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/actions/IActionDefinition.as::get geometryType()
    readonly geometryType: string;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/actions/IActionDefinition.as::get isAnimation()
    readonly isAnimation: boolean;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/actions/IActionDefinition.as::get startFromFrameZero()
    readonly startFromFrameZero: boolean;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/actions/IActionDefinition.as::isAnimated()
    isAnimated(part: string): boolean;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/actions/IActionDefinition.as::getPrevents()
    getPrevents(id?: string): string[];

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/actions/IActionDefinition.as::getPreventHeadTurn()
    getPreventHeadTurn(id?: string): boolean;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/actions/IActionDefinition.as::setOffsets()
    setOffsets(setType: string, direction: number, offsets: number[]): void;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/actions/IActionDefinition.as::getOffsets()
    getOffsets(setType: string, direction: number): number[] | null;
}
