// The reactive layer's public surface. Entirely TS-only — AS3 has no
// equivalent; its views are hand-wired. Design and constraints:
// docs/REACTIVE-UI.md. Ported AS3 views must NOT adopt this layer (§2 there).
export {signal, computed} from './Signal';
export type {SignalReader, SignalWriter} from './Signal';
export {Scope, effect, onCleanup, untrack, getCurrentScope} from './Effect';
export {Scheduler} from './Scheduler';
export type {IFlushEmitter} from './Scheduler';
