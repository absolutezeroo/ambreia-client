import type {IConnection} from '../connection/IConnection';
import type {IMessageEvent, MessageEventCallback, ParserClass} from './IMessageEvent';
import type {IMessageParser} from './IMessageParser';

/**
 * Base implementation of message event
 * Extend this class to create handlers for specific message types
 */
export class MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback, parserClass: ParserClass)
    {
        this._callback = callback;
        this._parserClass = parserClass;
    }

    protected _disposed: boolean = false;

    get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: .../src/com/sulake/core/communication/messages/MessageEvent.as::_callback
    protected _callback: MessageEventCallback;

    // AS3: .../src/com/sulake/core/communication/messages/MessageEvent.as::get callback()
    get callback(): MessageEventCallback
    {
        return this._callback;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/communication/messages/MessageEvent.as::_connection
    protected _connection: IConnection | null = null;

    // AS3: .../src/com/sulake/core/communication/messages/MessageEvent.as::get connection()
    get connection(): IConnection | null
    {
        return this._connection;
    }

    // AS3: .../src/com/sulake/core/communication/messages/MessageEvent.as::set connection()
    set connection(value: IConnection | null)
    {
        this._connection = value;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/communication/messages/MessageEvent.as::_parserClass
    protected _parserClass: ParserClass;

    // AS3: .../src/com/sulake/core/communication/messages/MessageEvent.as::get parserClass()
    get parserClass(): ParserClass
    {
        return this._parserClass;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/communication/messages/MessageEvent.as::_parser
    protected _parser: IMessageParser | null = null;

    // AS3: .../src/com/sulake/core/communication/messages/MessageEvent.as::get parser()
    get parser(): IMessageParser | null
    {
        return this._parser;
    }

    // AS3: .../src/com/sulake/core/communication/messages/MessageEvent.as::set parser()
    set parser(value: IMessageParser | null)
    {
        this._parser = value;
    }

    /**
	 * Get the parser cast to a specific type.
	 */
    // DEVIATION: AS3 has no generics, so *every* event subclass redeclares
    //   `getParser():<ItsOwnParserClass>` purely to narrow `parser`'s return type — the body is
    //   always `return _SafeStr_4545 as <ParserClass>`. One generic method on the base says the
    //   same thing once, which is why no ported event carries the override. The three traces
    //   below are the ones `as3-member-coverage.mjs` can see (their AS3 files are cited by name in
    //   `HabboMessages.ts`); the same override exists on ~580 more.
    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2102/_SafeCls_2935.as::getParser()
    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2102/_SafeCls_2101.as::getParser()
    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2538/_SafeCls_3768.as::getParser()
    getParser<T extends IMessageParser>(): T
    {
        return this._parser as T;
    }

    // AS3: .../src/com/sulake/core/communication/messages/MessageEvent.as::dispose()
    dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;

        this._callback = null!;
        this._parserClass = null!;
        this._connection = null;
        this._parser = null;
    }
}
