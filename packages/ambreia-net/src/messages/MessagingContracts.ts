import type {IDisposable} from '@ambreia/common/IDisposable';
import type {IMessageDataWrapper} from './IMessageDataWrapper';
import type {IMessageComposer} from './IMessageComposer';
import type {IMessageParser} from './IMessageParser';
import type {IEncryption} from '../encryption/IEncryption';
import type {IPacketTap} from '../connection/IPacketTap';

export type MessageEventCallback = (event: IMessageEvent) => void;
export type ParserClass<T extends IMessageParser = IMessageParser> = new () => T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- constructor args must be `any` for variance compatibility
export type ComposerClass = new (...args: any[]) => IMessageComposer<unknown[]>;
export type EventClass = new (callback: MessageEventCallback) => IMessageEvent;

export interface IMessageEvent extends IDisposable
{
    readonly callback: MessageEventCallback;

    connection: IConnection | null;

    readonly parserClass: ParserClass;

    parser: IMessageParser | null;
}

export interface IMessageConfiguration
{
    readonly events: Map<number, EventClass>;

    readonly composers: Map<number, ComposerClass>;
}

export interface IConnection extends IDisposable
{
    readonly connected: boolean;

    timeout: number;

    init(host: string, port?: number, tcpNoDelay?: boolean): boolean;

    createSocket(): void;

    addListener(type: string, listener: (...args: unknown[]) => void): void;

    send(composer: IMessageComposer<unknown[]>): boolean;

    sendUnencrypted(composer: IMessageComposer<unknown[]>): boolean;

    setEncryption(clientToServer: IEncryption, serverToClient: IEncryption): void;

    isAuthenticated(): void;

    isConfigured(): void;

    getServerToClientEncryption(): IEncryption | null;

    getClientToServerEncryption(): IEncryption | null;

    registerMessageClasses(config: IMessageConfiguration): void;

    addMessageEvent(event: IMessageEvent): void;

    removeMessageEvent(event: IMessageEvent): void;

    processReceivedData(): void;

    close(): void;

    on(event: 'messageEvent', listener: (event: IMessageEvent) => void): this;

    off(event: 'messageEvent', listener: (event: IMessageEvent) => void): this;

    setPacketTap(tap: IPacketTap | null): void;

    injectIncoming(messageId: number, values: unknown[]): void;

    handleIncoming(header: number, name: string, handler: (wrapper: IMessageDataWrapper) => void): () => void;

    sendValues(header: number, name: string, values: unknown[]): boolean;
}
