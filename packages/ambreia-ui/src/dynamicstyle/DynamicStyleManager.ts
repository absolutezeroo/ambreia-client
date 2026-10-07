import {DynamicStyle} from './DynamicStyle';

/**
 * Static registry of dynamic styles by name.
 *
 * Lazily initializes the five built-in styles — lifted_hover, brightness_and_shadow_under,
 * brightness_and_shadow_under_gentle, reward_track_item, button — and allows lookup by name.
 *
 * The class is `_SafeCls_2995` in the primary tree; the name `DynamicStyleManager` is RECOVERED
 * from the 2016 tree, where the same class is unobfuscated.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/dynamicstyle/_SafeCls_2995.as
 */
export class DynamicStyleManager
{
    // AS3: .../src/com/sulake/core/window/dynamicstyle/_SafeCls_2995.as::_styles
    private static _styles: Map<string, DynamicStyle> | null = null;

    /**
	 * Returns the dynamic style registered under the given name.
	 *
	 * @param name - The style name
	 * @returns The matching style, or a new empty DynamicStyle if not found
	 */
    // AS3: .../src/com/sulake/core/window/dynamicstyle/_SafeCls_2995.as::getStyle()
    public static getStyle(name: string): DynamicStyle
    {
        if(!DynamicStyleManager._styles)
        {
            DynamicStyleManager.fillStyleTable();
        }

        const style = DynamicStyleManager._styles!.get(name);

        if(style)
        {
            return style;
        }

        return new DynamicStyle();
    }

    /**
	 * Registers a custom dynamic style.
	 *
	 * @param name - The style name
	 * @param style - The dynamic style instance
	 */
    // TS-only: AS3's table is filled once and never added to; the port lets a caller register one.
    public static register(name: string, style: DynamicStyle): void
    {
        if(!DynamicStyleManager._styles)
        {
            DynamicStyleManager.fillStyleTable();
        }

        DynamicStyleManager._styles!.set(name, style);
    }

    /**
	 * Checks whether a style with the given name is registered.
	 *
	 * @param name - The style name to look up
	 * @returns True if the style exists
	 */
    // TS-only: AS3 has no such probe — `getStyle()` returns an empty style for an unknown name.
    public static hasStyle(name: string): boolean
    {
        if(!DynamicStyleManager._styles)
        {
            DynamicStyleManager.fillStyleTable();
        }

        return DynamicStyleManager._styles!.has(name);
    }

    // AS3: .../src/com/sulake/core/window/dynamicstyle/_SafeCls_2995.as::fillStyleTable()
    private static fillStyleTable(): void
    {
        DynamicStyleManager._styles = new Map();

        const liftedHover = new DynamicStyle('lifted_hover');
        liftedHover.defaultStyles = {};
        liftedHover.pressedSyles = {
            offsetX: 1,
            colorTransform: [1, 0.7, 0.7, 0.7, 0, 0, 0, 0],
        };
        liftedHover.hoverStyles = {
            offsetY: -1,
            offsetX: -1,
        };

        const liftedIcon = new DynamicStyle();
        liftedIcon.defaultStyles = {
            etchingColor: 0x48000000,
            etchingPoint: [1, 1],
        };
        liftedIcon.hoverStyles = {
            etchingColor: 0x80000000,
            etchingPoint: [2, 2],
        };
        liftedIcon.pressedSyles = {
            etchingColor: 0x48000000,
            etchingPoint: [-1, -1],
        };
        liftedHover.childDynamicStyles.set('#icon', liftedIcon);

        const brightnessAndShadow = new DynamicStyle('brightness_and_shadow_under');
        brightnessAndShadow.defaultStyles = {};

        const bsIcon = new DynamicStyle();
        bsIcon.defaultStyles = {
            etchingColor: 0x48000000,
            etchingPoint: [0, 1],
        };
        bsIcon.pressedSyles = {
            etchingColor: 0x80000000,
            etchingPoint: [0, -1],
            offsetY: 1,
            colorTransform: [0.7, 0.7, 0.7, 1, 0, 0, 0, 0],
        };
        bsIcon.hoverStyles = {
            etchingColor: 0x48000000,
            etchingPoint: [0, 1],
            colorTransform: [1, 1, 1, 1, 77, 77, 77, 0],
        };
        brightnessAndShadow.childDynamicStyles.set('#icon', bsIcon);

        const bsBg = new DynamicStyle();
        bsBg.defaultStyles = {
            etchingColor: 0x48000000,
            etchingPoint: [0, 1],
        };
        bsBg.pressedSyles = {
            etchingColor: 0x80000000,
            etchingPoint: [0, 0],
            colorTransform: [0.9, 0.9, 0.9, 1, 0, 0, 0, 0],
        };
        bsBg.hoverStyles = {
            etchingColor: 0x48000000,
            etchingPoint: [0, 1],
            colorTransform: [1, 1, 1, 1, 77, 77, 77, 0],
        };
        bsBg.disabledStyles = {
            colorTransform: [0.5, 0.5, 0.5, 0.7, 0, 0, 0, 0],
        };
        brightnessAndShadow.childDynamicStyles.set('#bg', bsBg);

        const brightnessAndShadowGentle = new DynamicStyle('brightness_and_shadow_under_gentle');
        brightnessAndShadowGentle.defaultStyles = {};

        const bsgIcon = new DynamicStyle();
        bsgIcon.defaultStyles = {
            etchingColor: 0x48000000,
            etchingPoint: [0, 1],
        };
        bsgIcon.pressedSyles = {
            etchingColor: 0x80000000,
            etchingPoint: [0, -1],
            offsetY: 1,
            colorTransform: [0.8, 0.8, 0.8, 1, 0, 0, 0, 0],
        };
        bsgIcon.hoverStyles = {
            etchingColor: 0x48000000,
            etchingPoint: [0, 1],
            colorTransform: [1.1, 1.1, 1.1, 1, 30, 30, 30, 0],
        };
        brightnessAndShadowGentle.childDynamicStyles.set('#icon', bsgIcon);

        const rewardTrackItem = new DynamicStyle('reward_track_item');
        rewardTrackItem.defaultStyles = {};

        const rewardIcon = new DynamicStyle();
        rewardIcon.defaultStyles = {
            etchingColor: 0x48000000,
            etchingPoint: [0, 1],
        };
        rewardIcon.pressedSyles = {
            etchingColor: 0x80000000,
            etchingPoint: [0, -1],
            offsetY: 1,
            colorTransform: [0.8, 0.8, 0.8, 1, 0, 0, 0, 0],
        };
        rewardIcon.hoverStyles = {
            etchingColor: 0x48000000,
            etchingPoint: [0, 1],
            colorTransform: [1.1, 1.1, 1.1, 1, 15, 15, 15, 0],
        };
        rewardIcon.disabledStyles = {
            colorTransform: [0.75, 0.75, 0.75, 0.8, 0, 0, 0, 0],
        };
        rewardTrackItem.childDynamicStyles.set('#icon', rewardIcon);

        const button = new DynamicStyle('button');
        button.defaultStyles = {};

        const btnIcon = new DynamicStyle();
        btnIcon.defaultStyles = {
            etchingColor: 0x48000000,
            etchingPoint: [0, 0],
        };
        btnIcon.pressedSyles = {
            etchingColor: 0x80000000,
            etchingPoint: [0, 0],
            offsetY: 1,
            colorTransform: [0.8, 0.8, 0.8, 1, 0, 0, 0, 0],
        };
        btnIcon.hoverStyles = {
            etchingColor: 0x48000000,
            etchingPoint: [0, 0],
            colorTransform: [1.1, 1.1, 1.1, 1, 15, 15, 15, 0],
        };
        button.childDynamicStyles.set('#icon', btnIcon);

        DynamicStyleManager._styles.set('lifted_hover', liftedHover);
        DynamicStyleManager._styles.set('brightness_and_shadow_under', brightnessAndShadow);
        DynamicStyleManager._styles.set('brightness_and_shadow_under_gentle', brightnessAndShadowGentle);
        DynamicStyleManager._styles.set('reward_track_item', rewardTrackItem);
        DynamicStyleManager._styles.set('button', button);
    }
}
