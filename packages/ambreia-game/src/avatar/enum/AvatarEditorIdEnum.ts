/**
 * Which editor instance a call is about — the manager keeps one `HabboAvatarEditor` per id.
 *
 * Class name DERIVED: the AS3 file is `enum/_SafeCls_1943.as` and the identifier exists in no
 * tree. Named for what it enumerates and for `HabboAvatarEditorManager`'s `_editors` map, which is
 * keyed by these.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/enum/_SafeCls_1943.as
 */
export class AvatarEditorIdEnum
{
    // AS3: .../avatar/enum/_SafeCls_1943.as::MAIN_EDITOR
    // Name DERIVED (`_SafeStr_11087`): id 0, the one the me-menu and the link event open, and the
    // only one every message handler looks up.
    public static readonly MAIN_EDITOR: number = 0;

    // AS3: .../avatar/enum/_SafeCls_1943.as::FURNITURE_EDITOR
    // Name DERIVED (`_SafeStr_11192`): id 1, opened embedded by the clothing-change furni.
    public static readonly FURNITURE_EDITOR: number = 1;

    // AS3: .../avatar/enum/_SafeCls_1943.as::BOT_EDITOR
    public static readonly BOT_EDITOR: number = 2;

    // AS3: .../avatar/enum/_SafeCls_1943.as::DEV_TOOL_EDITOR
    public static readonly DEV_TOOL_EDITOR: number = 3;

    /**
     * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/enum/_SafeCls_1943.as::isDevelopmentEditor()
     *
     * ⚠ AS3 writes `param1 == 2 || param1 == 2 || param1 == 3` — the **2 is duplicated and the 1 is
     * absent**. Almost certainly meant to be `1 || 2 || 3` or `2 || 3`; either way it reduces to
     * "2 or 3", which is what this returns. Ported verbatim rather than corrected, because the
     * only caller is `HabboAvatarEditorManager.close()`, where the test decides whether the
     * closing editor keeps the user's last activated effect — and guessing the intent would
     * silently change that for the furniture editor.
     */
    // AS3: .../avatar/enum/_SafeCls_1943.as::isDevelopmentEditor()
    public static isDevelopmentEditor(editorId: number): boolean
    {
        return editorId === AvatarEditorIdEnum.BOT_EDITOR
            || editorId === AvatarEditorIdEnum.BOT_EDITOR
            || editorId === AvatarEditorIdEnum.DEV_TOOL_EDITOR;
    }
}
