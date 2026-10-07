/**
 * HabboWebApiMethod
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/HabboWebApiMethod.as
 *
 * API endpoint path constants for the Habbo Web API.
 */
export class HabboWebApiMethod 
{
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiMethod.as::FORCE_EMAIL_CHANGE
    public static readonly FORCE_EMAIL_CHANGE = '/api/force/email-change';
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiMethod.as::FORCE_PASSWORD_CHANGE
    public static readonly FORCE_PASSWORD_CHANGE = '/api/force/password-change';
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiMethod.as::FORCE_TOS_ACCEPT
    public static readonly FORCE_TOS_ACCEPT = '/api/force/tos-accept';

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiMethod.as::LOGIN
    public static readonly LOGIN = '/api/public/authentication/login';
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiMethod.as::AUTHENTICATE_USER
    public static readonly AUTHENTICATE_USER = '/api/public/authentication/user';
    public static readonly FACEBOOK = '/api/public/authentication/facebook';
    public static readonly RPX = '/api/public/authentication/rpx';
    public static readonly LOGOUT = '/api/public/authentication/logout';

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiMethod.as::REGISTER
    public static readonly REGISTER = '/api/public/registration/new';
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiMethod.as::ACTIVATE
    public static readonly ACTIVATE = '/api/public/registration/activate';

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiMethod.as::FORGOT_PASSWORD
    public static readonly FORGOT_PASSWORD = '/api/public/forgotPassword/send';
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiMethod.as::CHANGE_PASSWORD
    public static readonly CHANGE_PASSWORD = '/api/public/forgotPassword/changePassword';

    public static readonly HELLO = '/api/public/info/hello';
    public static readonly TIME = '/api/public/info/time';
    public static readonly CAPTCHA = '/api/public/captcha';

    public static readonly ACHIEVEMENTS = '/api/public/achievements';
    public static readonly ACHIEVEMENTS_FOR_ID = '/api/public/achievements/:id';
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiMethod.as::GROUPS
    public static readonly GROUPS = '/api/public/groups/:id';
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiMethod.as::MEMBERS
    public static readonly MEMBERS = '/api/public/groups/:id/members';
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiMethod.as::POPULAR_ROOMS
    public static readonly POPULAR_ROOMS = '/api/public/rooms/popular';
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiMethod.as::ROOM
    public static readonly ROOM = '/api/public/rooms/:roomId';
    public static readonly HOTLOOKS = '/api/public/lists/hotlooks';

    public static readonly SELF = '/api/user/self';
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiMethod.as::PROFILE
    public static readonly PROFILE = '/api/user/profile';
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiMethod.as::PING
    public static readonly PING = '/api/user/ping';
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiMethod.as::PREFERENCES
    public static readonly PREFERENCES = '/api/user/preferences';
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiMethod.as::SAVE_USER
    public static readonly SAVE_USER = '/api/user/preferences/save';
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiMethod.as::SAVE_VISIBILITY
    public static readonly SAVE_VISIBILITY = '/api/user/preferences/save/visibility';
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiMethod.as::CREDIT_BALANCE
    public static readonly CREDIT_BALANCE = '/api/user/credit_balance';
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiMethod.as::CHANGE_EMAIL
    public static readonly CHANGE_EMAIL = '/api/user/email/change';
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiMethod.as::SAVE_LOOKS
    public static readonly SAVE_LOOKS = '/api/user/look/save';
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiMethod.as::COMMON_FRIENDS
    public static readonly COMMON_FRIENDS = '/api/user/:id/common_friends';

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiMethod.as::AVATARS
    public static readonly AVATARS = '/api/user/avatars';
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiMethod.as::SELECT_AVATAR
    public static readonly SELECT_AVATAR = '/api/user/avatars/select';
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiMethod.as::CREATE_AVATAR
    public static readonly CREATE_AVATAR = '/api/user/avatars';

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiMethod.as::NAME_CHECK
    public static readonly NAME_CHECK = '/api/newuser/name/check';
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiMethod.as::SELECT_USER
    public static readonly SELECT_USER = '/api/newuser/name/select';
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiMethod.as::SELECT_ROOM
    public static readonly SELECT_ROOM = '/api/newuser/room/select';

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiMethod.as::FRIEND_REQUESTS_SENT
    public static readonly FRIEND_REQUESTS_SENT = '/api/user/friendrequests/sent';
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiMethod.as::FRIEND_REQUESTS_RECEIVED
    public static readonly FRIEND_REQUESTS_RECEIVED = '/api/user/friendrequests/received';

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiMethod.as::CAMPAIGN_MESSAGES
    public static readonly CAMPAIGN_MESSAGES = '/api/user/campaign_messages';
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiMethod.as::CAMPAIGN_MESSAGES_ALL
    public static readonly CAMPAIGN_MESSAGES_ALL = '/api/user/campaign_messages/all';
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiMethod.as::CAMPAIGN_MESSAGES_SEEN
    public static readonly CAMPAIGN_MESSAGES_SEEN = '/api/user/campaign_messages/seen';

    public static readonly DISCUSSIONS = '/api/user/discussions';

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiMethod.as::SAFETY_LOCK_STATUS
    public static readonly SAFETY_LOCK_STATUS = '/api/safetylock/featureStatus';
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiMethod.as::SAFETY_LOCK_DISABLE
    public static readonly SAFETY_LOCK_DISABLE = '/api/safetylock/disable';
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiMethod.as::SAFETY_LOCK_SAVE
    public static readonly SAFETY_LOCK_SAVE = '/api/safetylock/save';
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiMethod.as::SAFETY_LOCK_QUESTIONS
    public static readonly SAFETY_LOCK_QUESTIONS = '/api/safetylock/questions';
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiMethod.as::SAFETY_LOCK_UNLOCK
    public static readonly SAFETY_LOCK_UNLOCK = '/api/safetylock/unlock';
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiMethod.as::RESET_TRUSTED_LOGINS
    public static readonly RESET_TRUSTED_LOGINS = '/api/safetylock/resetTrustedLogins';

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiMethod.as::LOG_CRASH
    public static readonly LOG_CRASH = '/api/log/crash';
    public static readonly LOG_ERROR = '/api/log/error';
    public static readonly LOG_LOGIN_STEP = '/api/log/loginstep';

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiMethod.as::CLIENT_URL
    public static readonly CLIENT_URL = '/api/client/clienturl';
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiMethod.as::SSO_TOKEN
    public static readonly SSO_TOKEN = '/api/ssotoken';

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiMethod.as::IAP_VALIDATE_ITUNES_RECEIPT
    public static readonly IAP_VALIDATE_ITUNES_RECEIPT = '/shopapi/iap/itunes/validate';
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiMethod.as::IAP_VALIDATE_PLAYSTORE_RECEIPT
    public static readonly IAP_VALIDATE_PLAYSTORE_RECEIPT = '/shopapi/iap/playstore/validate';

    public static readonly DEVICE_TOKEN = '/api/pushwoosh/devicetoken';
}
