import type {IDisposable} from '@ambreia/common/IDisposable';

/** Updated every frame by the window manager. Same shape as the engine's IUpdateReceiver. */
export interface IWindowUpdateReceiver extends IDisposable
{
    update(deltaTime: number): void;
}
