import type {WindowController} from '../WindowController';

/**
 * Represents a dynamic style with state-based visual properties.
 *
 * In AS3, dynamic styles contained color transforms, offsets, and etching
 * properties per window state (default, hover, pressed, disabled). Each
 * style can also hold child styles keyed by tag (e.g. "#icon", "#bg").
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/dynamicstyle/DynamicStyle.as
 */
export class DynamicStyle
{
    // AS3: .../src/com/sulake/core/window/dynamicstyle/DynamicStyle.as::STYLE_LIFTED_HOVER
    public static readonly STYLE_LIFTED_HOVER: string = 'lifted_hover';
    // AS3: .../src/com/sulake/core/window/dynamicstyle/DynamicStyle.as::BRIGHTNESS_AND_SHADOW_UNDER
    public static readonly BRIGHTNESS_AND_SHADOW_UNDER: string = 'brightness_and_shadow_under';
    // AS3: .../src/com/sulake/core/window/dynamicstyle/DynamicStyle.as::BRIGHTNESS_AND_SHADOW_UNDER_GENTLE
    public static readonly BRIGHTNESS_AND_SHADOW_UNDER_GENTLE: string = 'brightness_and_shadow_under_gentle';
    // AS3: .../src/com/sulake/core/window/dynamicstyle/DynamicStyle.as::REWARD_TRACK_ITEM
    public static readonly REWARD_TRACK_ITEM: string = 'reward_track_item';
    // The AS3 constant is obfuscated (`_SafeStr_10357`) in every tree; `BUTTON` is DERIVED from its
    // value, "button", not recovered.
    // AS3: .../src/com/sulake/core/window/dynamicstyle/DynamicStyle.as::_SafeStr_10357
    public static readonly BUTTON: string = 'button';

    // AS3: .../src/com/sulake/core/window/dynamicstyle/DynamicStyle.as::name
    public name: string;
    // AS3: .../src/com/sulake/core/window/dynamicstyle/DynamicStyle.as::defaultStyles
    public defaultStyles: Record<string, unknown> = {};
    // AS3: .../src/com/sulake/core/window/dynamicstyle/DynamicStyle.as::hoverStyles
    public hoverStyles: Record<string, unknown> = {};
    // Spelled `pressedSyles` in AS3 — the typo is the source's, and it is the name every style
    // registry writes, so it is kept.
    // AS3: .../src/com/sulake/core/window/dynamicstyle/DynamicStyle.as::pressedSyles
    public pressedSyles: Record<string, unknown> = {};
    // AS3: .../src/com/sulake/core/window/dynamicstyle/DynamicStyle.as::disabledStyles
    public disabledStyles: Record<string, unknown> = {colorTransform: [1, 1, 1, 0.5, 0, 0, 0, 0]};

    // AS3: .../src/com/sulake/core/window/dynamicstyle/DynamicStyle.as::childDynamicStyles
    public childDynamicStyles: Map<string, DynamicStyle> = new Map();

    constructor(name: string = '')
    {
        this.name = name;
    }

    /**
	 * Returns the style properties for the given window state bitmask.
	 *
	 * @param state - The window state flag
	 * @returns The style properties object for that state
	 */
    // AS3: .../src/com/sulake/core/window/dynamicstyle/DynamicStyle.as::getStyleByWindowState()
    public getStyleByWindowState(state: number): Record<string, unknown>
    {
        switch(state)
        {
            case 16:
                return this.pressedSyles;
            case 4:
                return this.hoverStyles;
            case 0:
                return this.defaultStyles;
            case 32:
                return this.disabledStyles;
        }

        return {};
    }

    /**
	 * Returns the child dynamic style matching one of the window's tags.
	 *
	 * Tags beginning with "#" are checked against child style keys.
	 *
	 * @param window - The window whose tags to search
	 * @returns The matching child style, or null
	 */
    // AS3: .../src/com/sulake/core/window/dynamicstyle/DynamicStyle.as::getChildStyle()
    public getChildStyle(window: WindowController): DynamicStyle | null
    {
        for(const tag of window.tags)
        {
            if(tag.charAt(0) === '#')
            {
                return this.getChildDynamicStyleByKey(tag);
            }
        }

        return null;
    }

    /**
	 * Computes the color value for the given window state.
	 *
	 * @param state - The window state flag
	 * @returns The computed color value, or 0 if no color transform
	 */
    // DEVIATION: AS3 concatenates `toString(16)` unpadded, so any channel below 0x10 contributes a
    //   single digit and shifts every later nibble — 0x0A/0xFF/0xFF comes out as 0xAFFFF, not
    //   0x0AFFFF. The port pads to two digits. Flash never surfaced it because the styles shipped
    //   in the layouts have no dark channel.
    // AS3: .../src/com/sulake/core/window/dynamicstyle/DynamicStyle.as::getColorValue()
    public getColorValue(state: number): number
    {
        const props = this.getStyleByWindowState(state);
        const ct = props.colorTransform as number[] | null;

        if(ct)
        {
            let colorStr = '';

            for(let i = 0; i < 3; i++)
            {
                const channel = (ct[i] * 0xFF) + ct[i + 4];
                colorStr += Math.min(0xFF, channel).toString(16).padStart(2, '0');
            }

            return parseInt(colorStr, 16);
        }

        return 0;
    }

    /**
	 * Returns the color transform array for the given window state.
	 *
	 * @param state - The window state flag
	 * @returns Color transform as [rMul, gMul, bMul, aMul, rOff, gOff, bOff, aOff]
	 */
    // AS3: .../src/com/sulake/core/window/dynamicstyle/DynamicStyle.as::getColorTransform()
    public getColorTransform(state: number): {
        redMultiplier: number;
        greenMultiplier: number;
        blueMultiplier: number;
        alphaMultiplier: number;
        redOffset: number;
        greenOffset: number;
        blueOffset: number;
        alphaOffset: number
    }
    {
        const props = this.getStyleByWindowState(state);
        const ct = props.colorTransform as number[] | null;
        const tint = (props.tint as number[] | null) ?? [0xFF, 0xFF, 0xFF];

        if(ct)
        {
            return {
                redMultiplier: (ct[0] * tint[0]) / 0xFF,
                greenMultiplier: (ct[1] * tint[1]) / 0xFF,
                blueMultiplier: (ct[2] * tint[2]) / 0xFF,
                alphaMultiplier: ct[3],
                redOffset: ct[4],
                greenOffset: ct[5],
                blueOffset: ct[6],
                alphaOffset: ct[7],
            };
        }

        return {
            redMultiplier: 1,
            greenMultiplier: 1,
            blueMultiplier: 1,
            alphaMultiplier: 1,
            redOffset: 0,
            greenOffset: 0,
            blueOffset: 0,
            alphaOffset: 0,
        };
    }

    // AS3: .../src/com/sulake/core/window/dynamicstyle/DynamicStyle.as::getChildDynamicStyleByKey()
    private getChildDynamicStyleByKey(key: string): DynamicStyle
    {
        const child = this.childDynamicStyles.get(key);

        if(child)
        {
            return child;
        }

        return new DynamicStyle();
    }
}
