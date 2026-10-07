/**
 * HabboWebApiError
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/HabboWebApiError.as
 *
 * Error string constants for Web API responses.
 */
export class HabboWebApiError
{
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiError.as::INVALID_CAPTCHA
    public static readonly INVALID_CAPTCHA = 'invalid-captcha';
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiError.as::ACCOUNT_ISSUE
    public static readonly ACCOUNT_ISSUE = 'account_issue';
    public static readonly LOGIN_BLOCKED = 'login.blocked';
    public static readonly LOGIN_USER_BANNED = 'login.user_banned';
    public static readonly UNAUTHORIZED_STAFF_LOGIN = 'unauthorized-staff-login';
    public static readonly LOGIN_FAILED = 'pocket.auth.login_failed';
    /**
     * TS-only: the two second-factor answers `vortex-emulator` adds to this endpoint
     * (`WebApiAuthService.LoginAsync`). Both ride a 401 with no session, exactly like
     * `LOGIN_FAILED`, and the error string is the only thing telling them apart:
     * MFA_REQUIRED means "right password, now send a code", INVALID_CODE means "that code is wrong".
     */
    public static readonly MFA_REQUIRED = 'pocket.auth.mfa_required';
    public static readonly INVALID_CODE = 'pocket.auth.invalid_code';
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiError.as::LOGIN_NO_AVATARS
    public static readonly LOGIN_NO_AVATARS = 'pocket.auth.no_avatars';
    public static readonly VALID_EMAIL_REQUIRED = 'pocket.auth.valid_email_required';
    public static readonly PASSWORD_REQUIRED = 'pocket.auth.password_required';
    public static readonly FACEBOOK_DISABLED = 'pocket.auth.facebook_disabled';
    public static readonly FACEBOOK_NOT_CONNECTED = 'pocket.auth.facebook_not_connected';
    public static readonly ACCESS_TOKEN_REQUIRED = 'pocket.auth.access_token_required';
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiError.as::REGISTRATION_CAPTCHA_EMPTY
    public static readonly REGISTRATION_CAPTCHA_EMPTY = 'registration.captcha_is_empty';
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiError.as::REGISTRATION_CAPTCHA_INVALID
    public static readonly REGISTRATION_CAPTCHA_INVALID = 'registration.invalid_captcha';
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiError.as::REGISTRATION_DISABLED
    public static readonly REGISTRATION_DISABLED = 'registration.error.registration_disabled';
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiError.as::REGISTRATION_PASSWORD
    public static readonly REGISTRATION_PASSWORD = 'registration_password';
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiError.as::REGISTRATION_BIRTHDAY_FORMAT
    public static readonly REGISTRATION_BIRTHDAY_FORMAT = 'registration.birthdate_format';
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiError.as::REGISTRATION_INVALID_BIRTHDAY
    public static readonly REGISTRATION_INVALID_BIRTHDAY = 'registration.invalid_birthdate';
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiError.as::REGISTRATION_INVALID_PASSWORD
    public static readonly REGISTRATION_INVALID_PASSWORD = 'registration.invalid_password';
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiError.as::REGISTRATION_INVALID_EMAIL
    public static readonly REGISTRATION_INVALID_EMAIL = 'registration.invalid_email';
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiError.as::REGISTRATION_AGE_LIMIT
    public static readonly REGISTRATION_AGE_LIMIT = 'registration.age_limit';
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiError.as::REGISTRATION_EMAIL
    public static readonly REGISTRATION_EMAIL = 'registration_email';
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiError.as::REGISTRATION_EMAIL_IN_USE
    public static readonly REGISTRATION_EMAIL_IN_USE = 'registration_email_in_use';
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiError.as::REGISTRATION_EMAIL_UNAUTHORIZED
    public static readonly REGISTRATION_EMAIL_UNAUTHORIZED = 'registration_email_unauthorized';
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiError.as::REGISTRATION_PARENT_EMAIL
    public static readonly REGISTRATION_PARENT_EMAIL = 'registration_parent_email';
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiError.as::REGISTRATION_ERROR_SPAM
    public static readonly REGISTRATION_ERROR_SPAM = 'registration_error.spam';
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiError.as::REGISTRATION_ERROR_AGE_BAN
    public static readonly REGISTRATION_ERROR_AGE_BAN = 'registration.error.age_ban';
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiError.as::REGISTRATION_ERROR_IDENTITY_CREATION_FAILED
    public static readonly REGISTRATION_ERROR_IDENTITY_CREATION_FAILED = 'registration.error.identity_creation_failed';
}
