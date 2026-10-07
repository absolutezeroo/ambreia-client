import type {IMessageComposer} from './IMessageComposer';
import type {IMessageEvent, MessageEventCallback} from './IMessageEvent';

/**
 * Constructor type for composer classes
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- constructor args must be `any` for variance compatibility
export type ComposerClass = new (...args: any[]) => IMessageComposer<unknown[]>;

/**
 * Constructor type for event classes
 */
export type EventClass = new (callback: MessageEventCallback) => IMessageEvent;

/**
 * Interface for message configuration
 * Maps message IDs to their composer and event classes
 */
export interface IMessageConfiguration
{
    /**
	 * Map of message ID to incoming event class
	 */
    // AS3: .../src/com/sulake/core/communication/messages/IMessageConfiguration.as::get events()
    readonly events: Map<number, EventClass>;

    /**
	 * Map of message ID to outgoing composer class
	 */
    // AS3: .../src/com/sulake/core/communication/messages/IMessageConfiguration.as::get composers()
    readonly composers: Map<number, ComposerClass>;
}
