import type {IWidget} from './IWidget';

/**
 * Interface for progress indicator widgets.
 *
 * @see sources/win63_version/habbo/window/widgets/class_2339.as
 */
export interface IProgressIndicatorWidget extends IWidget
{
    // AS3: sources/win63_version/habbo/window/widgets/class_2339.as::get size()
    size: number;
    // AS3: sources/win63_version/habbo/window/widgets/class_2339.as::get position()
    position: number;
    // AS3: sources/win63_version/habbo/window/widgets/class_2339.as::get mode()
    mode: string;
}
