import type {VariableFxEditorState} from '../model/VariableFxEditorState';

/**
 * Who wants to know that the effect being edited changed.
 *
 * Every settings preset holds the same state object and edits it in place, so the notification
 * carries it back rather than a diff — the listener's job is to refresh whatever it shows and, when
 * `rebuild` is set, to re-lay-out because a section may have appeared or gone.
 *
 * Named for what it is: the AS3 interface is `_SafeCls_4242` and the name exists in no tree.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/roomevents/wired_setup/addons/variablefx/presets/_SafeCls_4242.as
 */
export interface IVariableFxStateListener
{
    // AS3: .../presets/_SafeCls_4242.as::variableFxStateChanged()
    variableFxStateChanged(state: VariableFxEditorState, rebuild?: boolean): void;
}
