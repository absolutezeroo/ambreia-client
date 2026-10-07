import type {IStaticBitmapWrapperWindow} from '@ambreia/ui/components/IStaticBitmapWrapperWindow';

/**
 * Switches a tab icon between its lit and unlit artwork.
 *
 * The two states are one asset name and the same name plus `_off`, so the toggle is a string
 * edit rather than a lookup: strip any existing `_off`, then append it again when going dark.
 * Stripping first is what makes the call idempotent — toggling off twice does not produce
 * `name_off_off`.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/common/TabUtils.as
 */
export class TabUtils
{
    // AS3: .../avatar/common/TabUtils.as::OFF_SUFFIX
    // Name DERIVED: the "_off" AS3 uses inline, both as the needle and as the suffix.
    private static readonly OFF_SUFFIX: string = '_off';

    /**
     * AS3's `replace` takes a *string* needle, which in ActionScript replaces only the **first**
     * occurrence. `String.prototype.replace` behaves the same way in JavaScript, so this is a
     * direct port — a name containing `_off` twice keeps its second one on both sides.
     */
    // AS3: .../avatar/common/TabUtils.as::setElementImage()
    public static setElementImage(element: IStaticBitmapWrapperWindow, enabled: boolean): void
    {
        const base = element.assetUri.replace(TabUtils.OFF_SUFFIX, '');

        element.assetUri = enabled ? base : base + TabUtils.OFF_SUFFIX;
    }
}
