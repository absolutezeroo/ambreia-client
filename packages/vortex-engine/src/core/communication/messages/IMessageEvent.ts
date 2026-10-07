import type {IDisposable} from '@ambreia/common/IDisposable';
import type {IConnection} from '../connection/IConnection';
import type {IMessageParser} from './IMessageParser';

/**
 * Callback function type for message events
 */
export type MessageEventCallback = (event: IMessageEvent) => void;

/**
 * Constructor type for parser classes
 */
export type ParserClass<T extends IMessageParser = IMessageParser> = new () => T;

/**
 * Interface for message event handlers
 * Links an incoming message type to a callback function
 *
 * Based on AS3: com.sulake.core.communication.messages.IMessageEvent
 */
export interface IMessageEvent extends IDisposable
{
    /**
	 * The callback function to invoke when this message is received
	 */
    // AS3: .../src/com/sulake/core/communication/messages/IMessageEvent.as::get callback()
    readonly callback: MessageEventCallback;

    /**
	 * The connection that received this message
	 */
    // AS3: .../src/com/sulake/core/communication/messages/IMessageEvent.as::get connection()
    connection: IConnection | null;

    /**
	 * The parser class constructor
	 */
    // AS3: .../src/com/sulake/core/communication/messages/IMessageEvent.as::get parserClass()
    readonly parserClass: ParserClass;

    /**
	 * The parser instance (shared among handlers for same message type)
	 */
    // AS3: .../src/com/sulake/core/communication/messages/IMessageEvent.as::get parser()
    parser: IMessageParser | null;
}
