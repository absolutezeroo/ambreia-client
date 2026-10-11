import type {IID} from './IID';

/** Callback invoked when the DI context resolves an interface request. */
export type InterfaceCallback<T = unknown> = (iid: IID<T>, instance: T) => void;
