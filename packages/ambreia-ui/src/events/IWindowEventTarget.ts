/**
 * Window surface carried by the base event object.
 *
 * `WindowEvent` only needs to retain the target and expose the fields generic event handlers read.
 * Concrete windows provide this shape structurally; specialized code can narrow back to its window
 * interface when it needs component-specific APIs.
 */
export interface IWindowEventTarget
{
    name: string;

    color: number;

    readonly parent: IWindowEventTarget | null;
}
