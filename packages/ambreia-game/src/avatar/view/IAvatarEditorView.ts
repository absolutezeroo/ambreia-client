import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IFrameWindow} from '@ambreia/ui/components/IFrameWindow';
import type {IWidgetWindow} from '@ambreia/ui/components/IWidgetWindow';
import type {IAvatarEditorGridView} from '../common/ICategoryView';
import type {IAvatarEditorNameChangeView} from './IAvatarEditorNameChangeView';

/**
 * The window side of the avatar editor.
 *
 * TS-only as an *interface*: AS3's editor holds the concrete `AvatarEditorView`. Extracted so the
 * editor core, the manager and the network handler do not have to import the window layer — the
 * same technique slices 2-4 used. `AvatarEditorView` satisfies it as written.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/AvatarEditorView.as
 */
export interface IAvatarEditorView
{
    // AS3: .../avatar/AvatarEditorView.as::get currentViewId()
    readonly currentViewId: string;

    // AS3: .../avatar/AvatarEditorView.as::get gridView()
    // The one grid shared by every tabbed page — see `CategoryBaseView.updateGridView()`.
    readonly gridView: IAvatarEditorGridView | null;

    // AS3: .../avatar/AvatarEditorView.as::get effectsGridView()
    // The same container wrapped by the effects page's own grid class.
    readonly effectsGridView: IAvatarEditorGridView | null;

    // AS3: .../avatar/AvatarEditorView.as::get avatarEditorNameChangeView()
    // Null until the rename button is clicked once — the dialog is built lazily, which is why
    // `AvatarEditorMessageHandler.onCheckUserNameResult()` drops a result that arrives before then.
    readonly avatarEditorNameChangeView: IAvatarEditorNameChangeView | null;

    // AS3: .../avatar/AvatarEditorView.as::get effectsParamViewContainer()
    readonly effectsParamViewContainer: IWindowContainer | null;

    // AS3: .../avatar/AvatarEditorView.as::getFrame()
    // Wraps the body in the standalone frame and hands it back — what `openEditor()` returns.
    getFrame(categories: string[] | null, title?: string | null): IFrameWindow | null;

    // AS3: .../avatar/AvatarEditorView.as::embedToContext()
    embedToContext(context: IWindowContainer | null, categories: string[] | null): boolean;

    // AS3: .../avatar/AvatarEditorView.as::validateAvailableCategories()
    validateAvailableCategories(categories: string[] | null): boolean;

    // AS3: .../avatar/AvatarEditorView.as::show()
    show(): void;

    // AS3: .../avatar/AvatarEditorView.as::hide()
    hide(): void;

    // AS3: .../avatar/AvatarEditorView.as::update()
    update(): void;

    // AS3: .../avatar/AvatarEditorView.as::toggleCategoryView()
    toggleCategoryView(categoryId: string, force?: boolean): void;

    // AS3: .../avatar/AvatarEditorView.as::getCategoryContainer()
    // The `<id>_content` container each `CategoryBaseView` fills its window from.
    getCategoryContainer(categoryId: string): IWindow | null;

    // AS3: .../avatar/AvatarEditorView.as::getFigureContainer()
    // The preview slot `FigureDataView` renders the edited avatar into.
    getFigureContainer(): IWidgetWindow | null;

    // AS3: .../avatar/AvatarEditorView.as::dispose()
    dispose(): void;
}
