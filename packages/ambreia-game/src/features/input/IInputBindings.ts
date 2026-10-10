/**
 * The keyboard, as the features see it (host.made.input): one listener for the page, chords bound
 * by name, and Escape as a stack. A chord is `event.key` for a letter (compared without case) or a
 * named key, and the digit for `Digit1`…`Digit9` (the row is shifted on an AZERTY keyboard) or the
 * numeric pad. Nothing fires while a text field has the keyboard, nor with Ctrl, Alt or Meta held.
 */
export interface IInputBindings
{
    /**
     * Binds a chord to its owner's handler; the same chord bound by two owners is an error naming
     * both, at bind time (so at boot). `when` gates the handler (in the world, a window open…).
     * Returns the unbind.
     */
    bind(owner: string, chord: string, handler: () => void, options?: {when?: () => boolean}): () => void;
    /**
     * Escape goes to the handlers last pushed first; the first one to return true has consumed it
     * (a tile pick before the target, a popup before the window under it). Returns the remover.
     */
    onEscape(owner: string, handler: () => boolean): () => void;
    /** True while the key event comes from a text field: a hotkey never steals a letter being typed. */
    typing(event: KeyboardEvent): boolean;
}
