import type {IMessageComposer} from './IMessageComposer';
import type {ComposerClass, EventClass, IMessageConfiguration} from './IMessageConfiguration';
import type {IMessageEvent} from './IMessageEvent';
import {Logger} from '@ambreia/common/utils/Logger';

const log = Logger.getLogger('core.communication.messages.MessageRegistry');

/**
 * Registry for message composers and event handlers
 * Maps message IDs to their respective classes and handlers
 */
export class MessageRegistry
{
    // Composer class name -> Message ID
    private _composerToId: Map<string, number> = new Map();

    // Event class name -> Message ID
    private _eventClassToId: Map<string, number> = new Map();

    // Message ID -> Array of event handlers
    private _idToEvents: Map<number, IMessageEvent[]> = new Map();

    // Composer class -> Message ID (direct reference)
    private _composerClassToId: Map<ComposerClass, number> = new Map();

    // Reverse lookups: Message ID -> Class name
    private _idToComposerName: Map<number, string> = new Map();
    private _idToEventName: Map<number, string> = new Map();

    /**
	 * Register all messages from a configuration
	 */
    registerMessages(config: IMessageConfiguration): void
    {
        // Register incoming message events
        for(const [id, eventClass] of config.events)
        {
            this.registerMessageEventClass(id, eventClass);
        }

        // Register outgoing message composers
        for(const [id, composerClass] of config.composers)
        {
            this.registerMessageComposerClass(id, composerClass);
        }
    }

    /**
	 * Register an event handler instance
	 */
    registerMessageEvent(event: IMessageEvent): void
    {
        const className = event.constructor.name;
        const id = this._eventClassToId.get(className);

        if(id === undefined)
        {
            // Once per class: kept code may subscribe to a message outside the contract on every room entry.
            log.once(`unknown-event:${className}`).warn(`Unknown message event class: ${className}`);
            return;
        }

        let events = this._idToEvents.get(id);

        if(events && events.length > 0)
        {
            // Reuse parser from first event handler
            event.parser = events[0].parser;
        }
        else
        {
            // Create new parser instance
            events = events ?? [];
            this._idToEvents.set(id, events);
            event.parser = new event.parserClass();
        }

        events.push(event);
    }

    /**
	 * Unregister an event handler
	 */
    unregisterMessageEvent(event: IMessageEvent): void
    {
        const className = event.constructor.name;
        const id = this._eventClassToId.get(className);

        if(id === undefined)
        {
            return;
        }

        const events = this._idToEvents.get(id);
        if(!events)
        {
            return;
        }

        const index = events.indexOf(event);
        if(index !== -1)
        {
            events.splice(index, 1);
        }
    }

    /**
	 * Get message ID for a composer instance
	 */
    getMessageIdForComposer(composer: IMessageComposer<unknown[]>): number
    {
        // Try by class reference first
        const composerClass = composer.constructor as ComposerClass;
        const idByClass = this._composerClassToId.get(composerClass);
        if(idByClass !== undefined)
        {
            return idByClass;
        }

        // Fallback to class name
        const className = composer.constructor.name;
        const id = this._composerToId.get(className);
        return id ?? -1;
    }

    /**
	 * Get all event handlers for a message ID
	 */
    getMessageEventsForId(id: number): IMessageEvent[] | null
    {
        return this._idToEvents.get(id) ?? null;
    }

    /**
	 * Check if a message ID has registered handlers
	 */
    hasMessageEvents(id: number): boolean
    {
        const events = this._idToEvents.get(id);
        return events !== undefined && events.length > 0;
    }

    /**
	 * Get incoming event name for a message ID
	 */
    getIncomingMessageName(id: number): string
    {
        const name = this._idToEventName.get(id);
        return name ? name.replace('MessageEvent', '') : 'Unknown';
    }

    /**
	 * Get outgoing composer name for a message ID
	 */
    getOutgoingMessageName(id: number): string
    {
        const name = this._idToComposerName.get(id);
        return name ? name.replace('MessageComposer', '') : 'Unknown';
    }

    /**
	 * Check if an incoming message ID is registered
	 */
    hasIncomingMessage(id: number): boolean
    {
        return this._idToEventName.has(id);
    }

    /**
	 * Check if an outgoing message ID is registered
	 */
    hasOutgoingMessage(id: number): boolean
    {
        return this._idToComposerName.has(id);
    }

    /**
	 * Clear all registrations
	 */
    clear(): void
    {
        this._composerToId.clear();
        this._eventClassToId.clear();
        this._idToEvents.clear();
        this._composerClassToId.clear();
        this._idToComposerName.clear();
        this._idToEventName.clear();
    }

    /**
	 * Register a composer class for a message ID
	 */
    private registerMessageComposerClass(id: number, composerClass: ComposerClass): void
    {
        const className = composerClass.name;

        if(this._composerToId.has(className))
        {
            log.warn(`Duplicate message ID definition for composer ${className}`);
        }

        this._composerToId.set(className, id);
        this._composerClassToId.set(composerClass, id);
        this._idToComposerName.set(id, className);
    }

    /**
	 * Register an event class for a message ID
	 */
    private registerMessageEventClass(id: number, eventClass: EventClass): void
    {
        const className = eventClass.name;

        if(this._eventClassToId.has(className))
        {
            log.warn(`Duplicate message ID definition for event ${className}`);
        }

        this._eventClassToId.set(className, id);
        this._idToEventName.set(id, className);
    }
}
