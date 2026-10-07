import type {IWidget} from './IWidget';
import type {IBitmapDataContainer} from '../../utils/IBitmapDataContainer';

/**
 * Interface for the badge image widget.
 *
 * Renders a badge image (normal, group, or perk) from a badge identifier.
 * Supports group badge live-refresh via message events.
 *
 * Obfuscated to `_SafeCls_2654` in the primary tree; the name comes from this port's own
 * implementor. The shape is verbatim: `_SafeCls_2028` (this port's `IWidget`) plus
 * `_SafeCls_1989` (`IBitmapDataContainer`) plus the members below.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/_SafeCls_2654.as
 */
export interface IBadgeImageWidget extends IWidget, IBitmapDataContainer
{
    /**
	 * The badge type: "normal", "group", or "perk" — see `BadgeImageType`.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/_SafeCls_2654.as::get type()
    type: string;

    /**
	 * The badge identifier string.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/_SafeCls_2654.as::get badgeId()
    badgeId: string;

    /**
	 * The group ID for group-type badges. Set to 0 to disable.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/_SafeCls_2654.as::get groupId()
    groupId: number;

    /**
	 * The glow tint, or -1 for no glow.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/_SafeCls_2654.as::get glowColor()
    glowColor: number;

    /**
	 * Plays the one-shot glow animation over the badge.
	 *
	 * @param color - The glow tint, 0xRRGGBB
	 * @param durationMs - Animation length; 0 or less means the 1000ms default
	 * @param scale - Peak scale of the glow
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/_SafeCls_2654.as::playGlow()
    playGlow(color: number, durationMs?: number, scale?: number): void;

    /**
	 * Stops the glow animation and restores the filters the widget had before it.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/_SafeCls_2654.as::clearGlow()
    clearGlow(): void;

    /**
	 * Re-reads the asset URI from the current type/badge id and repaints the bitmap.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/_SafeCls_2654.as::refresh()
    refresh(): void;
}
