import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {WardrobeOutfit} from '@ambreia/protocol/parser/wardrobe/WardrobeOutfit';
import type {IWardrobeController} from './IWardrobeController';
import type {ISideContentModel} from '../common/ISideContent';
import {ErrorReportStorage} from '@ambreia/common/utils/ErrorReportStorage';
import {OrderedMap} from '@ambreia/common/utils/OrderedMap';
import {WardrobeSlot} from './WardrobeSlot';
import {WardrobeView} from './WardrobeView';

/**
 * The wardrobe: N numbered slots, how many of them the user's subscription covers, and the request
 * that fills them from the server.
 *
 * `init()` runs lazily on the first `getWindowContainer()` and does three things in order — builds
 * the view, **asks the server for the saved outfits**, then creates one empty slot per available
 * position. The answer therefore arrives after the slots exist, which is what `updateSlots()`
 * relies on: it returns immediately when the model has not been initialised.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/wardrobe/WardrobeModel.as
 */
export class WardrobeModel implements ISideContentModel
{
    // AS3: .../avatar/wardrobe/WardrobeModel.as::SLOTS_KEY
    // Name DERIVED: the configuration key, with AS3's own default of 10.
    private static readonly SLOTS_KEY: string = 'avatareditor.wardrobe.slots';

    // AS3: .../avatar/wardrobe/WardrobeModel.as::DEFAULT_SLOTS
    private static readonly DEFAULT_SLOTS: number = 10;

    // AS3: .../avatar/wardrobe/WardrobeModel.as::CLUB_SLOTS
    // Name DERIVED: the 5 that splits club slots from VIP slots in `isSlotEnabled()`.
    private static readonly CLUB_SLOTS: number = 5;

    // AS3: .../avatar/wardrobe/WardrobeModel.as::_controller
    // Name DERIVED (`_SafeStr_4593`).
    private _controller: IWardrobeController | null;

    // AS3: .../avatar/wardrobe/WardrobeModel.as::_view
    // Name DERIVED (`_SafeStr_4550`).
    private _view: WardrobeView | null = null;

    // AS3: .../avatar/wardrobe/WardrobeModel.as::_slots
    // Name DERIVED (`_SafeStr_4648`): keyed by the **1-based** slot id the server uses.
    private _slots: OrderedMap<number, WardrobeSlot> | null = null;

    // AS3: .../avatar/wardrobe/WardrobeModel.as::_initialised
    // Name DERIVED (`_SafeStr_4755`).
    private _initialised: boolean = false;

    // AS3: .../avatar/wardrobe/WardrobeModel.as::WardrobeModel()
    constructor(controller: IWardrobeController | null)
    {
        this._controller = controller;
    }

    // AS3: .../avatar/wardrobe/WardrobeModel.as::get availableSlots()
    public get availableSlots(): number
    {
        return this._controller?.getInteger(WardrobeModel.SLOTS_KEY, WardrobeModel.DEFAULT_SLOTS)
            ?? WardrobeModel.DEFAULT_SLOTS;
    }

    // AS3: .../avatar/wardrobe/WardrobeModel.as::get controller()
    public get controller(): IWardrobeController | null
    {
        return this._controller;
    }

    // AS3: .../avatar/wardrobe/WardrobeModel.as::get slots()
    public get slots(): WardrobeSlot[]
    {
        return this._slots?.getValues() ?? [];
    }

    // AS3: .../avatar/wardrobe/WardrobeModel.as::reset()
    // Clears the flag only, so the next `getWindowContainer()` rebuilds the whole panel *and*
    // re-requests the outfits — the same one-way trip `init()` makes.
    public reset(): void
    {
        this._initialised = false;
    }

    // AS3: .../avatar/wardrobe/WardrobeModel.as::getWindowContainer()
    public getWindowContainer(): IWindowContainer | null
    {
        if(!this._initialised) this.init();

        return this._view?.getWindowContainer() ?? null;
    }

    /**
     * AS3: .../avatar/wardrobe/WardrobeModel.as::updateSlots()
     *
     * The server's answer. Each outfit names its own slot, so the list is sparse and unordered —
     * a slot with no entry keeps whatever it had.
     *
     * The first parameter is the wardrobe *state* the message carries, and AS3 **never reads it**;
     * kept in the signature because the call site passes it.
     *
     * The two null checks below only record debug data and then fall through into the loop that
     * would have thrown — AS3's, and kept: the report is the point, not the guard.
     */
    // AS3: .../avatar/wardrobe/WardrobeModel.as::updateSlots()
    public updateSlots(_state: number, outfits: WardrobeOutfit[] | null): void
    {
        if(!this._initialised) return;

        if(outfits === null) ErrorReportStorage.addDebugData('WardrobeModel', 'updateSlots: outfits is null!');
        if(this._slots === null) ErrorReportStorage.addDebugData('WardrobeModel', 'updateSlots: _slots is null!');

        for(const outfit of outfits ?? [])
        {
            const slot = this._slots?.getValue(outfit.slotId) ?? null;

            if(slot === null) continue;

            slot.update(outfit.figureString, outfit.gender, this.isSlotEnabled(slot.id));
        }
    }

    // AS3: .../avatar/wardrobe/WardrobeModel.as::dispose()
    // Nulls the controller **before** walking the slots, which is safe only because a slot's own
    // `dispose()` does not reach back through the model. Kept.
    public dispose(): void
    {
        this._controller = null;

        for(const slot of this._slots?.getValues() ?? []) slot?.dispose();

        this._slots = null;

        if(this._view !== null)
        {
            this._view.dispose();
            this._view = null;
        }

        this._initialised = false;
    }

    /**
     * AS3: .../avatar/wardrobe/WardrobeModel.as::init()
     *
     * Disposes the previous view and slots outright rather than reusing them, so every `reset()`
     * costs a fresh layout build and a fresh `getWardrobe()` round trip.
     *
     * Slot ids are **1-based** — the loop runs `1..availableSlots` — because that is what the
     * server's slot numbering uses.
     */
    // AS3: .../avatar/wardrobe/WardrobeModel.as::init()
    private init(): void
    {
        this._view?.dispose();
        this._view = new WardrobeView(this);

        this._controller?.handler?.getWardrobe();

        for(const slot of this._slots?.getValues() ?? []) slot?.dispose();

        this._slots = new OrderedMap<number, WardrobeSlot>();

        for(let id = 1; id <= this.availableSlots; id++)
        {
            this._slots.add(
                id,
                new WardrobeSlot(this._view.slotTemplate, this._controller, id, this.isSlotEnabled(id))
            );
        }

        this._initialised = true;
        this.updateView();
    }

    // AS3: .../avatar/wardrobe/WardrobeModel.as::updateView()
    private updateView(): void
    {
        this._view?.update();
    }

    // AS3: .../avatar/wardrobe/WardrobeModel.as::isSlotEnabled()
    // The first five slots come with club, the rest with VIP — so a plain club member sees five
    // usable slots and five dead ones.
    private isSlotEnabled(id: number): boolean
    {
        const sessionData = this._controller?.sessionData ?? null;

        if(id <= WardrobeModel.CLUB_SLOTS) return sessionData?.hasClub ?? false;

        return sessionData?.hasVip ?? false;
    }
}
