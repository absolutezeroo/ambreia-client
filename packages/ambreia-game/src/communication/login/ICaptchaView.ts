/**
 * ICaptchaView
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/login/_SafeCls_79.as
 *
 * All the login provider knows about the captcha view: how to take it down. The view itself is
 * built by the viewer (`ILoginViewer.createCaptchaView()`), because only the client side knows
 * what a view is.
 *
 * The AS3 interface name is obfuscated in every available tree; it is named here for what its one
 * member and its two implementors say it is (`WebCaptchaView implements _SafeCls_79`, stored in
 * `WebApiLoginProvider._captchaView`).
 */
export interface ICaptchaView
{
    // AS3: function dispose():void
    dispose(): void;
}
