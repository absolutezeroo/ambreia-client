import type {IWindowContainer} from '../IWindowContainer';

/**
 * Interface for box sizer windows.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/components/IBoxSizerWindow.as
 */
export interface IBoxSizerWindow extends IWindowContainer
{
    setHorizontalPadding(value: number): void;

    setVerticalPadding(value: number): void;

    setSpacing(value: number): void;

    setVertical(value: boolean): void;

    setAutoRearrange(value: boolean): void;

    getAutoRearrange(): boolean;
}
