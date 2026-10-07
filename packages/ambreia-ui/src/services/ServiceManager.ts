import type {IInternalWindowServices} from './IInternalWindowServices';
import type {IMouseDraggingService} from './IMouseDraggingService';
import type {IMouseScalingService} from './IMouseScalingService';
import type {IMouseListenerService} from './IMouseListenerService';
import type {IFocusManagerService} from './IFocusManagerService';
import type {IToolTipAgentService} from './IToolTipAgentService';
import type {IGestureAgentService} from './IGestureAgentService';
import {WindowMouseDragger} from './WindowMouseDragger';
import {WindowMouseScaler} from './WindowMouseScaler';
import {FocusManager} from './FocusManager';
import {WindowMouseListener} from './WindowMouseListener';
import {WindowToolTipAgent} from './WindowToolTipAgent';
import {GestureAgentService} from './GestureAgentService';

/**
 * Aggregates all internal window services.
 *
 * Creates and owns the mouse dragger, scaler, focus manager,
 * mouse listener, tooltip agent, and gesture agent.
 *
 * @see sources/win63_version/core/window/services/ServiceManager.as
 */
export class ServiceManager implements IInternalWindowServices
{
    private _dragger: WindowMouseDragger;
    private _scaler: WindowMouseScaler;
    private _mouseListener: WindowMouseListener;
    private _focusManager: FocusManager;
    private _toolTipAgent: WindowToolTipAgent;
    private _gestureAgent: IGestureAgentService;

    constructor()
    {
        this._dragger = new WindowMouseDragger();
        this._scaler = new WindowMouseScaler();
        this._mouseListener = new WindowMouseListener();
        this._focusManager = new FocusManager();
        this._toolTipAgent = new WindowToolTipAgent();
        this._gestureAgent = new GestureAgentService();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/ServiceManager.as::_disposed
    private _disposed: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/ServiceManager.as::get disposed()
    public get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/ServiceManager.as::getMouseDraggingService()
    public getMouseDraggingService(): IMouseDraggingService
    {
        return this._dragger;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/ServiceManager.as::getMouseScalingService()
    public getMouseScalingService(): IMouseScalingService
    {
        return this._scaler;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/ServiceManager.as::getMouseListenerService()
    public getMouseListenerService(): IMouseListenerService
    {
        return this._mouseListener;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/ServiceManager.as::getFocusManagerService()
    public getFocusManagerService(): IFocusManagerService
    {
        return this._focusManager;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/ServiceManager.as::getToolTipAgentService()
    public getToolTipAgentService(): IToolTipAgentService
    {
        return this._toolTipAgent;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/ServiceManager.as::getGestureAgentService()
    public getGestureAgentService(): IGestureAgentService
    {
        return this._gestureAgent;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/ServiceManager.as::dispose()
    public dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;

        this._dragger.dispose();
        this._scaler.dispose();
        this._mouseListener.dispose();
        this._focusManager.dispose();
        this._toolTipAgent.dispose();
    }
}
