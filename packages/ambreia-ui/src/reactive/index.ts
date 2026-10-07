// Window adapter of the TS-only reactive layer (docs/REACTIVE-UI.md §6).
// Ported AS3 views must NOT adopt this — see §2 there for the boundary.
export {createWindowScope} from './WindowScope';
export {bind, on} from './bind';
export {each} from './each';
export type {IEachOptions, IReconcilableList} from './each';
