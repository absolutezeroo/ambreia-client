/**
 * Window context layer indices.
 *
 * The window manager uses 4 layers with increasing z-order.
 * Each layer is an independent rendering context.
 *
 * @see sources/win63_version/habbo/window/HabboWindowManagerComponent.as (NUMBER_OF_CONTEXT_LAYERS = 4)
 */
export const WindowContextLayer =
    {
        BACKGROUND: 0,
        DEFAULT: 1,
        DIALOGS: 2,
        TOOLTIPS: 3,
        COUNT: 4,
    } as const;

export type WindowContextLayerValue = typeof WindowContextLayer[keyof typeof WindowContextLayer];
