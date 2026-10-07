/**
 * ILoginProvider
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/login/ILoginProvider.as
 *
 * What the login flow may ask of the provider. AS3 extends `IEventDispatcher` for the one event it
 * emits, `SSO_TOKEN_AVAILABLE`; this port carries that through eventemitter3, as everywhere else.
 */
import type {IHabboCommunicationManager} from '../IHabboCommunicationManager';

export interface ILoginProvider
{
    // AS3: function closeCaptcha():void
    closeCaptcha(): void;

    // AS3: function init(_arg_1:IHabboCommunicationManager):void
    init(communication: IHabboCommunicationManager | null): void;

    /**
     * AS3: function loginWithCredentials(_arg_1:String, _arg_2:String, _arg_3:int=0):void
     *
     * `_arg_3` is stored and never read by the 701 provider; kept because it is part of the
     * interface's shape. `code` is a TS-only fourth argument — see `IHabboWebApiSession.login()`.
     */
    // AS3: .../src/com/sulake/habbo/communication/login/ILoginProvider.as::loginWithCredentials()
    loginWithCredentials(email: string, password: string, loginMode?: number, code?: string): void;

    // AS3: function loginWithCredentialsWeb(_arg_1:String):void
    loginWithCredentialsWeb(uniqueId: string): void;

    /**
     * AS3: function selectAvatar(_arg_1:int):void
     *
     * Empty in `WebApiLoginProvider` — id-based selection was superseded by the uniqueId one.
     */
    // AS3: .../src/com/sulake/habbo/communication/login/ILoginProvider.as::selectAvatar()
    selectAvatar(id: number): void;

    // AS3: function selectAvatarUniqueid(_arg_1:String):void
    selectAvatarUniqueid(uniqueId: string): void;

    // TS-only: eventemitter3 subscription, standing in for AS3's IEventDispatcher.
    on(event: string, fn: (...args: any[]) => void): this;

    // TS-only: eventemitter3 unsubscription, standing in for AS3's IEventDispatcher.
    off(event: string, fn: (...args: any[]) => void): this;

    // TS-only: the port disposes its managers explicitly; AS3's provider is garbage-collected.
    dispose(): void;
}
