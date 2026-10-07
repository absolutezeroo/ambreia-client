/**
 * ICaptchaHandler
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/login/_SafeCls_82.as
 *
 * What the captcha view calls back into — implemented by `WebApiLoginProvider`. `getProperty()` is
 * on it because the view has to resolve `web.api` to know where the captcha lives.
 *
 * The AS3 interface name is obfuscated in every available tree; it is named here for its members
 * and its implementor (`WebApiLoginProvider implements _SafeCls_82`).
 */
export interface ICaptchaHandler
{
    // AS3: function handleCaptchaError():void
    handleCaptchaError(): void;

    // AS3: function handleCaptchaResult(_arg_1:String):void
    handleCaptchaResult(token: string): void;

    // AS3: function getProperty(_arg_1:String, _arg_2:Dictionary=null):String
    getProperty(key: string): string | null;
}
