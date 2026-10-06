import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {ICategoryModel} from './ICategoryModel';

/**
 * The window side of one editor page.
 *
 * Interface name DERIVED: the AS3 file is `_SafeCls_4089.as`. Named for its seven implementors —
 * `BodyView`, `HeadView`, `TorsoView`, `LegsView`, `MiscView`, `EffectsView` and `HotLooksView`
 * (AS3 has an eighth, the NFT page, which the RPG fork removed). The first six extend
 * `CategoryBaseView`; `HotLooksView` implements it directly, which is why the shared behaviour lives in a base class and not here.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/common/_SafeCls_4089.as
 */
export interface ICategoryView
{
    // AS3: .../avatar/common/_SafeCls_4089.as::dispose()
    dispose(): void;

    // AS3: .../avatar/common/_SafeCls_4089.as::init()
    init(): void;

    // AS3: .../avatar/common/_SafeCls_4089.as::reset()
    reset(): void;

    // AS3: .../avatar/common/_SafeCls_4089.as::getWindowContainer()
    getWindowContainer(): IWindowContainer | null;

    // AS3: .../avatar/common/_SafeCls_4089.as::switchCategory()
    // Takes the part type, unlike `ICategoryModel.switchCategory()`, whose argument is optional.
    switchCategory(partType: string): void;

    // AS3: .../avatar/common/_SafeCls_4089.as::showPalettes()
    showPalettes(partType: string, count: number): void;
}

/**
 * The grid of thumbnails and swatches inside a page.
 *
 * Interface name DERIVED: the AS3 file is `_SafeCls_3071.as`; named for its sole implementor,
 * `AvatarEditorGridView`.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/common/_SafeCls_3071.as
 */
export interface IAvatarEditorGridView
{
    // AS3: .../avatar/common/_SafeCls_3071.as::dispose()
    dispose(): void;

    // AS3: .../avatar/common/_SafeCls_3071.as::get window()
    readonly window: IWindowContainer | null;

    // AS3: .../avatar/common/_SafeCls_3071.as::initFromList()
    initFromList(model: ICategoryModel, partType: string): void;

    // AS3: .../avatar/common/_SafeCls_3071.as::showPalettes()
    showPalettes(count: number): void;
}
