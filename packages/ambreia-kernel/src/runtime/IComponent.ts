import type {EventEmitter} from 'eventemitter3';
import type {IDisposable} from '@ambreia/common/IDisposable';
import type {IID} from './IID';
import type {InterfaceCallback} from './InterfaceCallback';

/**
 * Public surface the DI context needs from an attached component.
 *
 * The context manages components through this contract instead of depending on the concrete
 * Component base class, which keeps the container boundary one-way.
 */
export interface IComponent extends IDisposable
{
    readonly locked: boolean;

    readonly events: EventEmitter;

    readonly pendingDependencyIids: string[];

    queueInterface<T>(iid: IID<T>, callback?: InterfaceCallback<T>): T | null;

    release(iid: IID): number;

    registerInterface<T>(iid: IID<T>, instance: T): void;

    getProvidedInterfaces(): IID[];

    purge(): void;

    toXMLString(indent?: number): string;
}
