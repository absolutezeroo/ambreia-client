/**
 * IHabboWebApiSession
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/_SafeCls_1762.as
 *
 * Interface for the Habbo Web API HTTP session.
 *
 * In AS3, each method is decorated with [HabboWebApiRoute(uri="...", method="...")]
 * metadata annotations. The HabboWebApiSession reads these via describeType() at runtime
 * to build a route dictionary. In TypeScript, we use a static ROUTES map instead.
 */
import type {IHabboWebApiListener} from './IHabboWebApiListener';

/**
 * Route definition — replaces AS3's [HabboWebApiRoute] metadata annotation.
 */
export interface IWebApiRouteDefinition {
    uri: string;
    method: string;
    requiresSession?: boolean;
}

/**
 * Static route map — maps method name to route definition.
 * This replaces AS3's describeType() + [HabboWebApiRoute] reflection pattern.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/_SafeCls_1762.as
 */
export const WEB_API_ROUTES: Record<string, IWebApiRouteDefinition> = {
    emailChange: {uri: '/api/force/email-change', method: 'POST'},
    passwordChange: {uri: '/api/force/password-change', method: 'POST'},
    tosAccept: {uri: '/api/force/tos-accept', method: 'POST'},
    captcha: {uri: '/api/public/captcha', method: 'GET', requiresSession: false},
    achievements: {uri: '/api/public/achievements', method: 'GET', requiresSession: false},
    achievementsForId: {uri: '/api/public/achievements/:id', method: 'GET', requiresSession: false},
    activate: {uri: '/api/public/registration/activate', method: 'POST', requiresSession: false},
    login: {uri: '/api/public/authentication/login', method: 'POST', requiresSession: false},
    facebook: {uri: '/api/public/authentication/facebook', method: 'POST', requiresSession: false},
    rpx: {uri: '/api/public/authentication/rpx', method: 'POST', requiresSession: false},
    logout: {uri: '/api/public/authentication/logout', method: 'POST'},
    authenticateUser: {uri: '/api/public/authentication/user', method: 'GET'},
    forgotPassword: {uri: '/api/public/forgotPassword/send', method: 'POST', requiresSession: false},
    changePassword: {uri: '/api/public/forgotPassword/changePassword', method: 'POST', requiresSession: false},
    groups: {uri: '/api/public/groups/:id', method: 'GET', requiresSession: false},
    members: {uri: '/api/public/groups/:id/members', method: 'GET', requiresSession: false},
    hello: {uri: '/api/public/info/hello', method: 'GET', requiresSession: false},
    time: {uri: '/api/public/info/time', method: 'GET', requiresSession: false},
    register: {uri: '/api/public/registration/new', method: 'POST', requiresSession: false},
    popularRooms: {uri: '/api/public/rooms/popular', method: 'GET', requiresSession: false},
    room: {uri: '/api/public/rooms/:roomId', method: 'GET', requiresSession: false},
    hotlooks: {uri: '/api/public/lists/hotlooks', method: 'GET', requiresSession: false},
    logCrash: {uri: '/api/log/crash', method: 'POST'},
    logError: {uri: '/api/log/error', method: 'POST'},
    logLoginStep: {uri: '/api/log/loginstep', method: 'POST'},
    clientUrl: {uri: '/api/client/clienturl', method: 'GET'},
    nameCheck: {uri: '/api/newuser/name/check', method: 'POST'},
    selectUser: {uri: '/api/newuser/name/select', method: 'POST'},
    selectRoom: {uri: '/api/newuser/room/select', method: 'POST'},
    safetyLockStatus: {uri: '/api/safetylock/featureStatus', method: 'GET'},
    safetyLockDisable: {uri: '/api/safetylock/disable', method: 'GET'},
    resetTrustedLogins: {uri: '/api/safetylock/resetTrustedLogins', method: 'GET'},
    safetyLockSave: {uri: '/api/safetylock/save', method: 'POST'},
    safetyLockQuestions: {uri: '/api/safetylock/questions', method: 'GET'},
    safetyLockUnlock: {uri: '/api/safetylock/unlock', method: 'POST'},
    commonFriends: {uri: '/api/user/:id/common_friends', method: 'GET'},
    preferences: {uri: '/api/user/preferences', method: 'GET'},
    self: {uri: '/api/user/self', method: 'GET'},
    ping: {uri: '/api/user/ping', method: 'GET'},
    saveUser: {uri: '/api/user/preferences/save', method: 'POST'},
    saveVisibility: {uri: '/api/user/preferences/save/visibility', method: 'POST'},
    campaignMessages: {uri: '/api/user/campaign_messages', method: 'GET'},
    campaignMessagesAll: {uri: '/api/user/campaign_messages/all', method: 'GET'},
    campaignMessagesSeen: {uri: '/api/user/campaign_messages/seen', method: 'GET'},
    discussions: {uri: '/api/user/discussions', method: 'GET'},
    creditBalance: {uri: '/api/user/credit_balance', method: 'GET'},
    friendRequestsSent: {uri: '/api/user/friendrequests/sent', method: 'GET'},
    friendRequestsReceived: {uri: '/api/user/friendrequests/received', method: 'GET'},
    saveLooks: {uri: '/api/user/look/save', method: 'POST'},
    avatars: {uri: '/api/user/avatars', method: 'GET'},
    selectAvatar: {uri: '/api/user/avatars/select', method: 'POST'},
    changeEmail: {uri: '/api/user/email/change', method: 'POST'},
    createAvatar: {uri: '/api/user/avatars', method: 'POST'},
    profile: {uri: '/api/user/profile', method: 'GET'},
    ssoToken: {uri: '/api/ssotoken', method: 'GET'},
    validateItunesIAP: {uri: '/shopapi/iap/itunes/validate', method: 'POST'},
    validatePlaystoreIAP: {uri: '/shopapi/iap/playstore/validate', method: 'POST'},
    setDeviceToken: {uri: '/api/pushwoosh/devicetoken', method: 'POST'},
};

export interface IHabboWebApiSession {
    readonly disposed: boolean;
    readonly captchaToken: string | null;

    addListener(listener: IHabboWebApiListener): boolean;

    removeListener(listener: IHabboWebApiListener): void;

    setCaptchaToken(token: string): boolean;

    emailChange(newEmail: string): void;

    passwordChange(newPassword: string): void;

    tosAccept(): void;

    captcha(): void;

    achievements(): void;

    achievementsForId(id: number): void;

    time(): void;

    activate(token: string): void;

    hello(): void;

    /**
     * TS-only third argument: `vortex-emulator`'s `/api/public/authentication/login` reads a `Code`
     * off the body and answers 401 `pocket.auth.mfa_required` when the account has a second factor
     * the request did not carry. AS3 has no such argument — the 701 client predates the factor.
     */
    login(email: string, password: string, code?: string): void;

    facebook(accessToken: string): void;

    rpx(token: string): void;

    logout(): void;

    authenticateUser(): void;

    forgotPassword(email: string): void;

    changePassword(token: string, password: string, answer1: string, answer2: string): void;

    register(email: string, password: string, day: number, month: number, year: number, tos: boolean, captchaToken: string): void;

    groups(id: number): void;

    members(id: number): void;

    popularRooms(): void;

    room(id: number): void;

    hotlooks(): void;

    logCrash(message: string): void;

    logError(message: string): void;

    logLoginStep(step: string, extra: string): void;

    clientUrl(): void;

    ssoToken(): void;

    nameCheck(name: string): void;

    selectUser(name: string): void;

    selectRoom(roomIndex: number): void;

    safetyLockStatus(): void;

    safetyLockDisable(): void;

    resetTrustedLogins(): void;

    safetyLockSave(password: string, q1Id: number, a1: string, q2Id: number, a2: string): void;

    safetyLockQuestions(): void;

    safetyLockUnlock(answer1: string, answer2: string, trustDevice: boolean): void;

    commonFriends(id: number): void;

    preferences(): void;

    self(): void;

    ping(): void;

    saveUser(): void;

    saveVisibility(visible: boolean): void;

    campaignMessages(): void;

    campaignMessagesAll(): void;

    campaignMessagesSeen(): void;

    discussions(): void;

    creditBalance(): void;

    friendRequestsSent(): void;

    friendRequestsReceived(): void;

    saveLooks(figure: string, gender: string): void;

    changeEmail(newEmail: string, currentPassword: string): void;

    profile(): void;

    avatars(): void;

    selectAvatar(uniqueId: string): void;

    createAvatar(name: string): void;

    validateItunesIAP(transactionId: string, receipt: string, centPrice: number, priceLocale: string): void;

    validatePlaystoreIAP(transactionId: string, receipt: string, centPrice: number, priceLocale: string, signature: string): void;

    setDeviceToken(token: string): void;

    getDeviceToken(): string;

    dispose(): void;
}
