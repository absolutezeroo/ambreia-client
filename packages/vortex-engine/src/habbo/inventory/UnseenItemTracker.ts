import type {EventEmitter} from 'eventemitter3';
import type {IHabboCommunicationManager} from '../communication/IHabboCommunicationManager';
import type {HabboInventory} from './HabboInventory';
import type {IMessageEvent} from '@core/communication/messages/IMessageEvent';
import {INVENTORY_CATEGORIES, UnseenItemCategory} from './enum';
import {HabboUnseenItemsUpdatedEvent} from './events/HabboUnseenItemsUpdatedEvent';
import {UnseenItemsMessageEvent} from '../communication/messages/incoming/inventory/unseen/UnseenItemsMessageEvent';
import type {UnseenItemsMessageParser} from '../communication/messages/parser/inventory/unseen/UnseenItemsMessageParser';
import {ResetUnseenItemsComposer} from '../communication/messages/outgoing/inventory/ResetUnseenItemsComposer';
import {ResetUnseenItemIdsComposer} from '../communication/messages/outgoing/inventory/ResetUnseenItemIdsComposer';

/**
 * Tracks items the user hasn't viewed yet
 *
 * Based on AS3 com.sulake.habbo.inventory.UnseenItemTracker
 */
export class UnseenItemTracker
{
    // AS3: .../src/com/sulake/habbo/inventory/UnseenItemTracker.as::_communication
    private _communication: IHabboCommunicationManager | null;
    // AS3: .../src/com/sulake/habbo/inventory/UnseenItemTracker.as::_inventory
    private _inventory: HabboInventory;
    private _events: EventEmitter;
    // AS3: .../src/com/sulake/habbo/inventory/UnseenItemTracker.as::_unseenItems
    private _unseenItems: Map<number, Set<number>> = new Map();

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/UnseenItemTracker.as:23
    // Items already promoted to the top of their list, so it only happens once each.
    private _movedToTop: Map<number, Set<number>> = new Map();

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/UnseenItemTracker.as::UnseenItemTracker()
    constructor(communication: IHabboCommunicationManager, events: EventEmitter, inventory: HabboInventory)
    {
        this._communication = communication;
        this._events = events;
        this._inventory = inventory;

        // AS3 subscribes here. Without it addItems() had no caller, every count stayed 0, and the
        // "new items" badges could never appear.
        this._communication.addHabboConnectionMessageEvent(
            new UnseenItemsMessageEvent(this.onUnseenItems.bind(this))
        );
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/UnseenItemTracker.as::onUnseenItems()
    private onUnseenItems(event: IMessageEvent): void
    {
        const parser = event.parser as UnseenItemsMessageParser;

        if(!parser) return;

        for(const [category, itemIds] of parser.categories)
        {
            this.addItems(category, itemIds);
        }

        this.onUnseenItemsUpdate();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/UnseenItemTracker.as::setUnseenItem()
    setUnseenItem(category: number, itemId: number): void
    {
        this.addItems(category, [itemId]);
        this.onUnseenItemsUpdate();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/UnseenItemTracker.as::onUnseenItemsUpdate()
    private onUnseenItemsUpdate(): void
    {
        if(this._inventory.isInitialized)
        {
            this._inventory.updateUnseenItemCounts();

            // AS3 calls furniModel.updateUnseenItemsThumbs(), which takes no ids and reads
            // getIds(1)/getIds(2) off the tracker itself (FurniModel.as:1045-1046). The port
            // inverted that — updateUnseenItems() is handed the ids — so feed it the same two
            // categories AS3 reads.
            this._inventory.furniModel.updateUnseenItemsThumbs([
                ...this.getIds(UnseenItemCategory.OWNED_FURNI),
                ...this.getIds(UnseenItemCategory.RENTED_FURNI),
            ]);
            this._inventory.petsModel.updateView();
            this._inventory.botsModel.updateView();
        }

        this.sendUpdateEvent();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/UnseenItemTracker.as::setUnseenItemMovedToTop()
    setUnseenItemMovedToTop(category: number, itemIds: number[]): void
    {
        this.addItems(category, itemIds, this._movedToTop);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/UnseenItemTracker.as::isUnseenItemMovedToTop()
    isUnseenItemMovedToTop(category: number, itemId: number): boolean
    {
        return this._movedToTop.get(category)?.has(itemId) ?? false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/UnseenItemTracker.as::removeItemsFromMovedToTop()
    private removeItemsFromMovedToTop(category: number, itemIds: number[]): void
    {
        const items = this._movedToTop.get(category);

        if(!items || !itemIds) return;

        for(const itemId of itemIds)
        {
            items.delete(itemId);
        }
    }

    /**
	 * Check if an item is unseen
	 */
    // AS3: .../src/com/sulake/habbo/inventory/UnseenItemTracker.as::isUnseen()
    isUnseen(category: number, itemId: number): boolean
    {
        const items = this._unseenItems.get(category);

        return items?.has(itemId) ?? false;
    }

    /**
	 * Get all unseen item IDs for a category
	 */
    // AS3: .../src/com/sulake/habbo/inventory/UnseenItemTracker.as::getIds()
    getIds(category: number): number[]
    {
        const items = this._unseenItems.get(category);

        return items ? Array.from(items) : [];
    }

    /**
	 * Get count of unseen items in a category
	 */
    // AS3: .../src/com/sulake/habbo/inventory/UnseenItemTracker.as::getCount()
    getCount(category: number): number
    {
        return this._unseenItems.get(category)?.size ?? 0;
    }

    /**
	 * Get total count of all unseen inventory items
	 */
    getTotalInventoryCount(): number
    {
        let total = 0;

        for(const category of INVENTORY_CATEGORIES)
        {
            total += this.getCount(category);
        }

        return total;
    }

    /**
	 * Add unseen items to a category, defaulting to the unseen dictionary.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/UnseenItemTracker.as::addItems()
    // AS3 does not dispatch from here — onUnseenItemsUpdate() does, once, after the caller has
    // added everything. Dispatching per call would fire once per category on a full unseen list.
    private addItems(category: number, itemIds: number[], target: Map<number, Set<number>> | null = null): void
    {
        if(!itemIds)
        {
            return;
        }

        const dictionary = target ?? this._unseenItems;

        let items = dictionary.get(category);

        if(!items)
        {
            items = new Set();
            dictionary.set(category, items);
        }

        for(const itemId of itemIds)
        {
            items.add(itemId);
        }
    }

    /**
	 * Remove a single unseen item
	 */
    // AS3: .../src/com/sulake/habbo/inventory/UnseenItemTracker.as::removeUnseen()
    removeUnseen(category: number, itemId: number): boolean
    {
        const items = this._unseenItems.get(category);

        if(items?.has(itemId))
        {
            items.delete(itemId);

            // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/UnseenItemTracker.as::removeUnseen()
            this.removeItemsFromMovedToTop(category, [itemId]);

            this.sendUpdateEvent();

            return true;
        }

        return false;
    }

    /**
	 * Reset all unseen items in a category
	 */
    // AS3: .../src/com/sulake/habbo/inventory/UnseenItemTracker.as::resetCategory()
    resetCategory(category: number): boolean
    {
        if(this.getCount(category) === 0)
        {
            return false;
        }

        this._unseenItems.delete(category);

        // AS3 drops the category from both dictionaries here.
        this._movedToTop.delete(category);

        this.sendResetCategoryMessage(category);
        this.sendUpdateEvent();

        return true;
    }

    /**
	 * Reset specific items in a category
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/UnseenItemTracker.as::resetItems()
    resetItems(category: number, itemIds: number[]): boolean
    {
        const items = this._unseenItems.get(category);

        if(!items || items.size === 0)
        {
            return false;
        }

        for(const itemId of itemIds)
        {
            items.delete(itemId);
        }

        this.removeItemsFromMovedToTop(category, itemIds);
        this.sendResetItemsMessage(category, itemIds);
        this.sendUpdateEvent();

        return true;
    }

    /**
	 * Reset category if it's empty
	 */
    // AS3: .../src/com/sulake/habbo/inventory/UnseenItemTracker.as::resetCategoryIfEmpty()
    resetCategoryIfEmpty(category: number): boolean
    {
        if(this.getCount(category) === 0)
        {
            this._unseenItems.delete(category);
            this._movedToTop.delete(category);
            this.sendResetCategoryMessage(category);
            this.sendUpdateEvent();

            return true;
        }

        return false;
    }

    /**
	 * Dispose the tracker
	 */
    // AS3: .../src/com/sulake/habbo/inventory/UnseenItemTracker.as::dispose()
    dispose(): void
    {
        this._unseenItems.clear();
    }

    /**
	 * Send update event with current counts
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/UnseenItemTracker.as::sendUpdateEvent()
    private sendUpdateEvent(): void
    {
        const event = new HabboUnseenItemsUpdatedEvent();

        for(const category of INVENTORY_CATEGORIES)
        {
            const count = this.getCount(category);

            event.setCategoryCount(category, count);
            event.inventoryCount += count;
        }

        this._events.emit(HabboUnseenItemsUpdatedEvent.HUIUE_UNSEEN_ITEMS_CHANGED, event);
    }

    /**
	 * Send reset category message to server
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/UnseenItemTracker.as::sendResetCategoryMessage()
    private sendResetCategoryMessage(category: number): void
    {
        this._communication?.connection?.send(new ResetUnseenItemsComposer(category));
    }

    /**
	 * Send reset items message to server
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/UnseenItemTracker.as::sendResetItemsMessage()
    private sendResetItemsMessage(category: number, itemIds: number[]): void
    {
        this._communication?.connection?.send(new ResetUnseenItemIdsComposer(category, itemIds));
    }
}
