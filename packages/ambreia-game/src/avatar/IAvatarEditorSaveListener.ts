/**
 * Who receives the figure when an embedded editor saves.
 *
 * Interface name DERIVED: the AS3 file is `_SafeCls_2054.as` and the identifier exists in no tree.
 * Named for its one method and its one role — `openEditor()`/`embedEditorToContext()` take it, and
 * `HabboAvatarEditor.saveCurrentSelection()` calls it **instead of** sending the figure to the
 * server. A standalone editor passes null and the save goes to the server instead.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/_SafeCls_2054.as
 */
export interface IAvatarEditorSaveListener
{
    // AS3: .../avatar/_SafeCls_2054.as::saveFigure()
    saveFigure(figure: string, gender: string): void;
}
