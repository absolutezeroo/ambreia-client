/**
 * ILoginViewer
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/login/ILoginViewer.as
 *
 * Everything `WebApiLoginProvider` can tell the login flow. It is deliberately fine-grained — AS3
 * routes each web-API failure to its own method, and `LoginFlow` is what folds them back into one
 * error balloon. Collapsing them here would move that decision into the engine.
 *
 * Several of these are empty in `LoginFlow`, which is what the 701 source says: the provider calls
 * them, the desktop flow has nowhere to put them (`showLoginScreen`, `showLoadingScreen`,
 * `showSelectAvatar`, `showPromoHabbos`, `showSelectRoom`).
 */
import type {AvatarData} from './AvatarData';
import type {ICaptchaView} from './ICaptchaView';

export interface ILoginViewer
{
    // AS3: function getProperty(_arg_1:String, _arg_2:Dictionary=null):String
    getProperty(key: string): string | null;

    // AS3: function showLoginScreen():void
    showLoginScreen(): void;

    // AS3: function showRegistrationError(_arg_1:Object):void
    showRegistrationError(error: unknown): void;

    // AS3: function showInvalidLoginError(_arg_1:Object):void
    showInvalidLoginError(error: unknown): void;

    /**
     * AS3: function nameCheckResponse(_arg_1:Object, _arg_2:Boolean):void
     *
     * `_arg_2` is not "the name is valid" — it is `uri == "/api/newuser/name/check"`, i.e. which of
     * the two endpoints answered.
     */
    // AS3: .../src/com/sulake/habbo/communication/login/ILoginViewer.as::nameCheckResponse()
    nameCheckResponse(response: unknown, fromNameCheck: boolean): void;

    // AS3: function showAccountError(_arg_1:Object):void
    showAccountError(error: unknown): void;

    // AS3: function showLoadingScreen():void
    showLoadingScreen(): void;

    // AS3: function saveLooksError(_arg_1:Object):void
    saveLooksError(error: unknown): void;

    // AS3: function showTOS():void
    showTOS(): void;

    // AS3: function environmentReady():void
    environmentReady(): void;

    // AS3: function populateCharacterList(_arg_1:Vector.<AvatarData>):void
    populateCharacterList(avatars: AvatarData[]): void;

    // AS3: function showSelectAvatar(_arg_1:Object):void
    showSelectAvatar(response: unknown): void;

    // AS3: function showPromoHabbos(_arg_1:XML):void
    showPromoHabbos(looks: unknown): void;

    // AS3: function showSelectRoom():void
    showSelectRoom(): void;

    // AS3: function showCaptchaError():void
    showCaptchaError(): void;

    // AS3: function createCaptchaView():ICaptchaView
    createCaptchaView(): ICaptchaView | null;

    // AS3: function captchaReady():void
    captchaReady(): void;
}
