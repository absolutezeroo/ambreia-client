import {Component} from '@ambreia/kernel/runtime/Component';
import {SocketConnection} from '@ambreia/net/connection/SocketConnection';
import type {ICoreCommunicationManager} from './ICoreCommunicationManager';
import type {IConnection} from '@ambreia/net/connection/IConnection';
import type {IConnectionCallback} from '@ambreia/net/connection/IConnectionCallback';
import type {IContext, IUpdateReceiver} from '@ambreia/kernel/runtime/IContext';

/**
 * Core communication manager.
 *
 * Manages all network connections and their lifecycle.
 * Registers as an IUpdateReceiver so processReceivedData()
 * is called each frame by the CoreComponentContext update loop.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/communication/CoreCommunicationManager.as
 */
export class CoreCommunicationManager extends Component implements ICoreCommunicationManager, IUpdateReceiver
{
    constructor(context: IContext)
    {
        super(context);
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/communication/CoreCommunicationManager.as::_connections
    private _connections: IConnection[] = [];

    /**
	 * Get all active connections
	 */
    get connections(): IConnection[]
    {
        return [...this._connections];
    }

    /**
	 * Create a new connection
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/communication/CoreCommunicationManager.as::createConnection()
    createConnection(callback?: IConnectionCallback): IConnection
    {
        if(this._disposed)
        {
            throw new Error('CommunicationManager has been disposed');
        }

        const connection = new SocketConnection(callback);
        this._connections.push(connection);

        return connection;
    }

    /**
	 * Update all connections — called each frame by CoreComponentContext.
	 *
	 * Processes received WebSocket data and dispatches message events.
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/communication/CoreCommunicationManager.as::update()
    update(_deltaTime: number): void
    {
        if(this._disposed) return;

        for(let i = this._connections.length - 1; i >= 0; i--)
        {
            const connection = this._connections[i];

            if(connection.disposed)
            {
                this._connections.splice(i, 1);
                continue;
            }

            connection.processReceivedData();
        }
    }

    /**
	 * Remove a connection
	 */
    removeConnection(connection: IConnection): void
    {
        const index = this._connections.indexOf(connection);

        if(index !== -1)
        {
            this._connections.splice(index, 1);
        }
    }

    protected override initComponent(): void
    {
        this.context.registerUpdateReceiver(this, 0);
    }

    /**
	 * Clean up all connections
	 */
    override dispose(): void
    {
        if(this._disposed) return;

        this.context.removeUpdateReceiver(this);

        for(const connection of this._connections)
        {
            connection.dispose();
        }

        this._connections.length = 0;
        super.dispose();
    }
}
