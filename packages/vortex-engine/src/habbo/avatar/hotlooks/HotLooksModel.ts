import type {IMessageEvent} from '@core/communication/messages/IMessageEvent';
import type {CategoryData} from '../common/CategoryData';
import type {ICategoryModel} from '../common/ICategoryModel';
import type {ICategoryModelOwner} from '../common/ICategoryModelOwner';
import {Logger} from '@ambreia/common/utils/Logger';
import {CategoryBaseModel} from '../common/CategoryBaseModel';
import {FigureData} from '../figuredata/FigureData';
import type {HotLooksMessageParser} from '@habbo/communication/messages/parser/hotlooks/HotLooksMessageParser';
import {HotLooksMessageEvent} from '@habbo/communication/messages/incoming/hotlooks/HotLooksMessageEvent';
import {GetHotLooksMessageComposer} from '@habbo/communication/messages/outgoing/hotlooks/GetHotLooksMessageComposer';
import {HotLooksView} from './HotLooksView';
import {Outfit} from '../wardrobe/Outfit';

const log = Logger.getLogger('habbo.avatar.hotlooks.HotLooksModel');

/**
 * The hot-looks page: twenty outfits the hotel is promoting, kept **per gender** and requested from
 * the server the moment the page's model is constructed — which is at editor `init()`, long before
 * anyone opens the tab.
 *
 * It is a `CategoryBaseModel` in name only: three of the base's methods are overridden to do
 * nothing, `getCategoryData()` always returns null, and `init()` never calls up, so `_categories`
 * stays null for this page's whole life.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/hotlooks/HotLooksModel.as
 */
export class HotLooksModel extends CategoryBaseModel implements ICategoryModel
{
    // AS3: .../avatar/hotlooks/HotLooksModel.as::CATEGORY_HOT_LOOKS
    // Declared in AS3 and referenced by nothing — neither here nor anywhere else in the client.
    public static readonly CATEGORY_HOT_LOOKS: string = 'hot_looks';

    // AS3: .../avatar/hotlooks/HotLooksModel.as::CATEGORY_MY_LOOKS
    // The same: declared, never used.
    public static readonly CATEGORY_MY_LOOKS: string = 'my_looks';

    // AS3: .../avatar/hotlooks/HotLooksModel.as::MAXIMUM_HOT_LOOKS
    private static readonly MAXIMUM_HOT_LOOKS: number = 20;

    // AS3: .../avatar/hotlooks/HotLooksModel.as::_hotLooks
    // Name DERIVED (`_SafeStr_5498`): gender → its outfits. AS3 keeps this in one `Dictionary`
    // alongside the two indices below, keyed `"M"` and `"M.index"`.
    private _hotLooks: Map<string, Outfit[]> = new Map();

    /**
     * AS3: .../avatar/hotlooks/HotLooksModel.as::_hotLooks
     *
     * The `"M.index"` / `"F.index"` half of the same dictionary, seeded to 0 in the constructor and
     * **read by nothing**. Kept so the initialisation is not silently dropped.
     */
    // AS3: .../avatar/hotlooks/HotLooksModel.as::HotLooksModel()
    private _hotLookIndices: Map<string, number> = new Map();

    // AS3: .../avatar/hotlooks/HotLooksModel.as::_hotLooksEvent
    // Name DERIVED (`_SafeStr_6762`): the message event this model registers for itself, rather
    // than going through `AvatarEditorMessageHandler` like everything else.
    private _hotLooksEvent: IMessageEvent | null = null;

    // AS3: .../avatar/hotlooks/HotLooksModel.as::HotLooksModel()
    constructor(controller: ICategoryModelOwner | null)
    {
        super(controller);

        this._hotLooks.set(FigureData.MALE, []);
        this._hotLooks.set(FigureData.FEMALE, []);
        this._hotLookIndices.set(FigureData.MALE, 0);
        this._hotLookIndices.set(FigureData.FEMALE, 0);

        this.requestHotLooks(controller);
    }

    // AS3: .../avatar/hotlooks/HotLooksModel.as::get hotLooks()
    // Keyed by the editor's **current** gender, so switching sex swaps the whole grid.
    public get hotLooks(): Outfit[]
    {
        return this._hotLooks.get(this._controller?.gender ?? FigureData.MALE) ?? [];
    }

    /**
     * AS3: .../avatar/hotlooks/HotLooksModel.as::selectHotLook()
     *
     * An outfit with an empty figure is skipped rather than worn — that is the guard against a
     * tile whose render never arrived.
     */
    // AS3: .../avatar/hotlooks/HotLooksModel.as::selectHotLook()
    public selectHotLook(index: number): void
    {
        const outfit = this.hotLooks[index] ?? null;

        if(outfit === null) return;
        if(outfit.figure === '') return;

        this._controller?.loadAvatarInEditor?.(outfit.figure, outfit.gender, this._controller.clubMemberLevel);
    }

    // AS3: .../avatar/hotlooks/HotLooksModel.as::switchCategory()
    // Empty override — this page has no part types to switch between.
    public override switchCategory(_partType: string = ''): void
    {
    }

    // AS3: .../avatar/hotlooks/HotLooksModel.as::getCategoryData()
    // Always null: the page's content is outfits, not a `CategoryData` grid.
    public override getCategoryData(_partType: string): CategoryData | null
    {
        return null;
    }

    // AS3: .../avatar/hotlooks/HotLooksModel.as::selectPart()
    // Empty override — selection goes through `selectHotLook()` instead.
    public override selectPart(_partType: string, _index: number): void
    {
    }

    /**
     * AS3: .../avatar/hotlooks/HotLooksModel.as::dispose()
     *
     * 🐛 Calls `super.dispose()` **first**, which nulls `_controller` — then guards the
     * unregistration on `controller && controller.manager && …`, which is now false. The message
     * event is therefore **never removed**, and a disposed model keeps receiving hot-look pushes
     * and keeps building `Outfit`s into a map it has already dropped. Kept as written.
     */
    public override dispose(): void
    {
        super.dispose();

        if(this._hotLooksEvent !== null)
        {
            if(this._controller?.manager?.connection != null)
            {
                this._controller.manager.connection.removeMessageEvent(this._hotLooksEvent);
            }

            this._hotLooksEvent = null;
        }

        this._hotLooks = new Map();
    }

    /**
     * AS3: .../avatar/hotlooks/HotLooksModel.as::init()
     *
     * Does **not** call `super.init()`, so `_categories` is never created for this page. Everything
     * inherited that walks it is null-guarded, and `getCategoryData()` is overridden anyway.
     */
    protected override init(): void
    {
        if(this._view === null) this._view = new HotLooksView(this);

        this._view.init();
        this._initialised = true;
    }

    /**
     * AS3: .../avatar/hotlooks/HotLooksModel.as::requestHotLooks()
     *
     * Registers on the connection directly rather than through `AvatarEditorMessageHandler` — this
     * model is the only part of the editor that does.
     */
    // AS3: .../avatar/hotlooks/HotLooksModel.as::requestHotLooks()
    private requestHotLooks(controller: ICategoryModelOwner | null): void
    {
        const connection = controller?.manager?.connection ?? null;

        if(connection === null) return;

        this._hotLooksEvent = new HotLooksMessageEvent(this.onHotLooksMessage);
        connection.addMessageEvent(this._hotLooksEvent);
        connection.send(new GetHotLooksMessageComposer(HotLooksModel.MAXIMUM_HOT_LOOKS));
    }

    /**
     * AS3: .../avatar/hotlooks/HotLooksModel.as::onHotLooksMessage()
     *
     * Appends — it never clears first, so a second answer doubles the grid.
     *
     * 🐛 The view is **not** told. Building each `Outfit` starts its render, but nothing calls
     * `HotLooksView.update()`, so looks that arrive after the page was last opened do not appear
     * until it is re-entered. Kept.
     */
    // AS3: .../avatar/hotlooks/HotLooksModel.as::onHotLooksMessage()
    private onHotLooksMessage = (rawEvent: IMessageEvent): void =>
    {
        const parser = (rawEvent as HotLooksMessageEvent).getParser() as HotLooksMessageParser | null;

        if(parser === null) return;

        for(const item of parser.hotLooks)
        {
            const bucket = this._hotLooks.get(item.gender.toUpperCase()) ?? null;

            if(bucket === null)
            {
                log.warn(`Hot look for unknown gender "${item.gender}" dropped`);

                continue;
            }

            bucket.push(new Outfit(this._controller, item.figureString, item.gender));
        }
    };

    // TS-only: keeps the seeded-but-unread AS3 index map referenced.
    private get unused(): unknown
    {
        return this._hotLookIndices;
    }
}
