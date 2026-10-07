import type {IConnection} from '@ambreia/net/connection/IConnection';
import type {IRoomHandlerListener} from '../IRoomHandlerListener';

/**
 * Base handler class
 *
 * Based on AS3: com.sulake.habbo.session.handler.BaseHandler
 *
 * Base class for all session handlers. Handlers listen to messages
 * and communicate state changes back to the RoomSessionManager via IRoomHandlerListener.
 */
export class BaseHandler
{
    /**
	 * The current room ID being handled.
	 * Updated by RoomSessionManager.updateHandlers()
	 */
    public roomId: number = 0;

    constructor(connection: IConnection | null, listener: IRoomHandlerListener)
    {
        this._connection = connection;
        this._listener = listener;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/handler/BaseHandler.as::_connection
    private _connection: IConnection | null;

    // AS3: .../src/com/sulake/habbo/session/handler/BaseHandler.as::get connection()
    get connection(): IConnection | null
    {
        return this._connection;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/handler/BaseHandler.as::_listener
    private _listener: IRoomHandlerListener;

    // AS3: .../src/com/sulake/habbo/session/handler/BaseHandler.as::get listener()
    get listener(): IRoomHandlerListener
    {
        return this._listener;
    }

    // AS3: .../src/com/sulake/habbo/session/handler/BaseHandler.as::_disposed
    private _disposed: boolean = false;

    // AS3: .../src/com/sulake/habbo/session/handler/BaseHandler.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: .../src/com/sulake/habbo/session/handler/BaseHandler.as::dispose()
    dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;

        this._connection = null;
        // @ts-expect-error - Nullifying for disposal
        this._listener = null;
    }
}
