import type {IWindow} from '@core/window/IWindow';
import {Logger} from '@ambreia/common/utils/Logger';
import type {GlazeLayoutName, GlazeSlot} from './GlazeLayoutSlots';

const log = Logger.getLogger('glaze.ui.LayoutSlots');

interface IFinder { findChildByName(name: string): IWindow | null; }

/**
 * Typed lookups into one editor layout. `slot` is narrowed to the names that
 * layout's XML actually declares, so a renamed or mistyped node is a compile
 * error instead of a silent null at runtime.
 */
export interface IGlazeSlots<TLayout extends GlazeLayoutName>
{
    /** The child registered under `slot`, or null if the parent is gone. */
    find(parent: IWindow | null, slot: GlazeSlot<TLayout>): IWindow | null;

    /** As `find`, cast to the structural widget interface the caller expects. */
    findAs<TWidget>(parent: IWindow | null, slot: GlazeSlot<TLayout>): TWidget | null;

    /** Sets the caption of a text slot; no-ops when the parent is gone. */
    setText(parent: IWindow | null, slot: GlazeSlot<TLayout>, text: string): void;
}

/**
 * Binds the slot helpers to a layout, once per module:
 *
 * ```ts
 * const ROW = slotsOf('glaze_prop_input_xml');
 * ROW.setText(row, 'glaze_prow_label', label);
 * const input = ROW.findAs<IInputWidget>(row, 'glaze_prow_input');
 * ```
 *
 * The layout name is only used to select the slot union and to name the layout
 * in warnings — `findChildByName()` searches the instance it is handed.
 */
export const slotsOf = <TLayout extends GlazeLayoutName>(layout: TLayout): IGlazeSlots<TLayout> =>
{
    const find = (parent: IWindow | null, slot: GlazeSlot<TLayout>): IWindow | null =>
    {
        if(!parent || parent.disposed)
        {
            return null;
        }

        const child = (parent as unknown as IFinder).findChildByName(slot);

        if(!child)
        {
            // The layout declares the slot, so a live parent missing it means the
            // XML and the code have drifted apart — regenerate GlazeLayoutSlots.
            log.warn(`Slot '${slot}' not found in a live '${layout}' instance.`);
        }

        return child;
    };

    return {
        find,
        findAs: <TWidget>(parent: IWindow | null, slot: GlazeSlot<TLayout>): TWidget | null =>
            find(parent, slot) as unknown as TWidget | null,
        setText: (parent: IWindow | null, slot: GlazeSlot<TLayout>, text: string): void =>
        {
            const target = find(parent, slot) as unknown as { text: string } | null;

            if(target)
            {
                target.text = text;
            }
        }
    };
};
