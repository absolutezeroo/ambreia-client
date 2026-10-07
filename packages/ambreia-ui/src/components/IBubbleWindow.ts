import type {IWindowContainer} from '../IWindowContainer';

/**
 * Interface for bubble windows with directional pointers.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/components/IBubbleWindow.as
 */
export interface IBubbleWindow extends IWindowContainer
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/components/IBubbleWindow.as::get direction()
    direction: string;
    pointerOffset: number;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/components/IBubbleWindow.as::get content()
    readonly content: IWindowContainer | null;
}
