/**
 * The avatar editor's one event name.
 *
 * AS3 dispatches it as a bare string from `HabboAvatarEditorManager` — `new Event("AVATAR_EDITOR_READY")`
 * — and keeps the constant here; this port's manager re-exports it off this class so both spellings
 * cannot drift apart.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/enum/AvatarEditorEvent.as
 */
export class AvatarEditorEvent
{
    // AS3: .../src/com/sulake/habbo/avatar/enum/AvatarEditorEvent.as::AVATAR_EDITOR_READY
    public static readonly AVATAR_EDITOR_READY: string = 'AVATAR_EDITOR_READY';
}
