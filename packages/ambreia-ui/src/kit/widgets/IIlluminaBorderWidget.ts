import type {IWidget} from './IWidget';

/**
 * Interface for the Illumina border widget.
 *
 * Renders a 9-slice border around content, with configurable style,
 * padding, and child window placement in top/bottom positions.
 *
 * @see sources/win63_version/habbo/window/widgets/IIlluminaBorderWidget.as
 */
export interface IIlluminaBorderWidget extends IWidget
{
    /**
	 * The border style name (e.g. "illumina_light", "illumina_dark").
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IIlluminaBorderWidget.as::get borderStyle()
    borderStyle: string;

    /**
	 * The name of the content child window.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IIlluminaBorderWidget.as::get contentChild()
    contentChild: string;

    /**
	 * The padding around the content child.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IIlluminaBorderWidget.as::get contentPadding()
    contentPadding: number;

    /**
	 * The padding on left/right sides for positioned children.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IIlluminaBorderWidget.as::get sidePadding()
    sidePadding: number;

    /**
	 * The margin around positioned children (used to clear border behind them).
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IIlluminaBorderWidget.as::get childMargin()
    childMargin: number;

    /**
	 * Name of the child positioned at top-left of the border.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IIlluminaBorderWidget.as::get topLeftChild()
    topLeftChild: string;

    /**
	 * Name of the child positioned at top-center of the border.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IIlluminaBorderWidget.as::get topCenterChild()
    topCenterChild: string;

    /**
	 * Name of the child positioned at top-right of the border.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IIlluminaBorderWidget.as::get topRightChild()
    topRightChild: string;

    /**
	 * Name of the child positioned at bottom-left of the border.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IIlluminaBorderWidget.as::get bottomLeftChild()
    bottomLeftChild: string;

    /**
	 * Name of the child positioned at bottom-center of the border.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IIlluminaBorderWidget.as::get bottomCenterChild()
    bottomCenterChild: string;

    /**
	 * Name of the child positioned at bottom-right of the border.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IIlluminaBorderWidget.as::get bottomRightChild()
    bottomRightChild: string;

    /**
	 * Whether landing view mode is active (hides left border pieces).
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IIlluminaBorderWidget.as::get landingViewMode()
    landingViewMode: boolean;
}
