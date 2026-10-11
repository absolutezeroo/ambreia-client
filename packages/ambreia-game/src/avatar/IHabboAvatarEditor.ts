import type {EventEmitter} from 'eventemitter3';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IAvatarEditorSaveListener} from './IAvatarEditorSaveListener';

/**
 * The avatar editor, as everything outside it sees it — six members, and the interface behind
 * `IID_HabboAvatarEditor`.
 *
 * Interface name DERIVED: the AS3 file is `_SafeCls_68.as` and the identifier exists in no tree.
 * Named from its DI symbol, `IIDHabboAvatarEditor`, and from its sole implementor
 * `HabboAvatarEditorManager`.
 *
 * The manager keeps one editor **per id** — see `AvatarEditorIdEnum` — so every method takes one.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/_SafeCls_68.as
 */
export interface IHabboAvatarEditor
{
    /**
     * Opens (or re-shows) an editor and returns its window.
     *
     * `saveListener` non-null diverts the save away from the server and into the caller —
     * that is how the clothing-change furni gets the figure instead of the user wearing it.
     * `categories` limits which pages are built; null means all of them.
     */
    // AS3: .../avatar/_SafeCls_68.as::openEditor()
    openEditor(
        editorId: number,
        saveListener: IAvatarEditorSaveListener | null,
        categories?: string[] | null,
        sideContentEnabled?: boolean,
        title?: string | null,
        defaultCategory?: string
    ): IWindowContainer | null;

    // AS3: .../avatar/_SafeCls_68.as::embedEditorToContext()
    // Always **replaces** any editor already at that id, unlike `openEditor()` which reuses one.
    embedEditorToContext(
        editorId: number,
        context: IWindowContainer | null,
        saveListener?: IAvatarEditorSaveListener | null,
        categories?: string[] | null,
        sideContentEnabled?: boolean,
        isDevelopmentEditor?: boolean
    ): boolean;

    // AS3: .../avatar/_SafeCls_68.as::loadAvatarInEditor()
    loadAvatarInEditor(editorId: number, figure: string, gender: string): void;

    // AS3: .../avatar/_SafeCls_68.as::loadOwnAvatarInEditor()
    loadOwnAvatarInEditor(editorId: number): void;

    // AS3: .../avatar/_SafeCls_68.as::get events()
    // Carries `AvatarUpdateEvent` on save and `AVATAR_EDITOR_READY` once the renderer is up.
    readonly events: EventEmitter;

    // AS3: .../avatar/_SafeCls_68.as::close()
    // What "close" means depends on the id — see `HabboAvatarEditorManager.close()`.
    close(editorId: number): void;
}
