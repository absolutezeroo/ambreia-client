import type {IDisposable} from '@ambreia/common/IDisposable';
import type {InterfaceCallback} from './IContext';
import type {IID} from './IID';

/**
 * What every DI component looks like to the container: disposable, plus the two calls that borrow
 * and give back another component's interface.
 *
 * The port had no counterpart until now — `Component` implements only `IDisposable`, and the
 * manager interfaces that AS3 declares `extends IUnknown` (e.g. `IHabboFriendBarData`) simply drop
 * the base. This exists because AS3 also has *empty* component interfaces, whose whole content is
 * the `extends IUnknown`; `IGroupForumController` is one, and without this there is nothing for it
 * to extend.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/IUnknown.as
 */
export interface IUnknown extends IDisposable
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/IUnknown.as::queueInterface()
    queueInterface<T>(iid: IID<T>, callback?: InterfaceCallback<T>): T | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/IUnknown.as::release()
    release(iid: IID): number;
}
