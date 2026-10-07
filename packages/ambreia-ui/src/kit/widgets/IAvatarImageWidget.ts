import type {IWidget} from './IWidget';

/**
 * Interface for the avatar image widget.
 *
 * Renders an avatar figure with configurable direction, scale, cropping,
 * and head-only mode. Supports click-to-profile navigation via userId.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/_SafeCls_2592.as
 */
export interface IAvatarImageWidget extends IWidget
{
    /**
	 * The avatar figure string (e.g. "hd-180-1.ch-210-66.lg-270-82.sh-290-81").
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/_SafeCls_2592.as::get figure()
    figure: string;

    /**
	 * The rendering scale: "h" (normal) or "sh" (small/half).
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/_SafeCls_2592.as::get scale()
    scale: string;

    /**
	 * Whether to render only the avatar head.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/_SafeCls_2592.as::get onlyHead()
    onlyHead: boolean;

    /**
	 * Whether to use the cropped image variant.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/_SafeCls_2592.as::get cropped()
    cropped: boolean;

    /**
	 * The avatar facing direction (0-7).
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/_SafeCls_2592.as::get direction()
    direction: number;

    /**
	 * Horizontal zoom applied to the rendered figure, from the
	 * `avatar_image:zoomX` window property. Defaults to 1.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/_SafeCls_2592.as::get zoomX()
    zoomX: number;

    /**
	 * Vertical zoom applied to the rendered figure, from the
	 * `avatar_image:zoomY` window property. Defaults to 1.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/_SafeCls_2592.as::get zoomY()
    zoomY: number;

    /**
	 * The user ID for click-to-profile behavior.
	 * Set to 0 to disable click handling.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/_SafeCls_2592.as::get userId()
    userId: number;
}
