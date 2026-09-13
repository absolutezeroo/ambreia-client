// Every call here is a route the emulator's web API actually serves — see
// ../../vortex-emulator/Vortex.WebApi/Hosting/WebApiEndpoints.cs, which is the contract this file
// mirrors. Authentication is a session COOKIE issued by the login endpoint (HttpOnly, so it is
// invisible to this code); there is no token to carry, which is also why the dev server proxies
// /api instead of pointing at :8080 — a cross-origin request would drop the cookie.
//
// The API has no "who am I" route. GET /api/user/avatars is the identity probe: it answers 401 with
// no session and the account's avatars with one, which is exactly what the ported client's
// LoginFlow leans on too.
//
// The payload types are NOT written here. `api.generated.ts` is produced from the API's own OpenAPI
// document by `pnpm api:types`, and that document is produced from the running pipeline by
// `OpenApiDocumentTests` — so a record renamed in C# becomes a compile error in the page that reads
// it, instead of an `undefined` nobody sees until the screen is blank. The aliases below exist only
// so the pages import a name rather than a subscript chain.
import type {components} from './api.generated';
import {t} from './i18n.js';

type Schemas = components['schemas'];

export type IProfileBadge = Schemas['ProfileBadge'];
export type IProfileFriend = Schemas['ProfileFriend'];
export type IProfileRoom = Schemas['ProfileRoom'];
export type IProfileGroup = Schemas['ProfileGroup'];
export type IProfileUser = Schemas['ProfileUser'];
export type IPlayerProfile = Schemas['PlayerProfile'];
export type IRoomSummary = Schemas['RoomSummary'];
export type IRoomPage = Schemas['RoomPage'];
export type IPlayerPurse = Schemas['PlayerPurse'];
export type IAvatarInfo = Schemas['AvatarInfo'];
export type IArticleSummary = Schemas['ArticleSummary'];
export type IArticleFeed = Schemas['ArticleFeed'];
export type IArticleDetail = Schemas['ArticleDetail'];
export type ISiteLanguages = Schemas['SiteLanguages'];
export type ILoginResponse = Schemas['LoginResponse'];
export type IRegistrationResponse = Schemas['RegistrationResponse'];
export type IPasswordChangeResponse = Schemas['PasswordChangeResponse'];
export type ISsoTicketResponse = Schemas['SsoTicketResponse'];
export type INameCheckResponse = Schemas['NameCheckResponse'];
export type INameSelectResponse = Schemas['NameSelectResponse'];
export type IEmptyResponse = Schemas['EmptyResponse'];
export type IPlayerPreferences = Schemas['PlayerPreferencesResponse'];
export type IAccountEmail = Schemas['AccountEmailResponse'];
export type ISafetyLock = Schemas['SafetyLockResponse'];
export type ISafetyQuestions = Schemas['SafetyQuestionsResponse'];
export type ITrustedLocationsReset = Schemas['TrustedLocationsResetResponse'];
export type ITwoFactorStatus = Schemas['TwoFactorStatusResponse'];
export type ITwoFactorEnrolment = Schemas['TwoFactorEnrolmentResponse'];
export type IShopProduct = Schemas['ShopProduct'];
export type IShopSection = Schemas['ShopSection'];
export type IShopCatalog = Schemas['ShopCatalog'];
export type IShopOrder = Schemas['ShopOrder'];
export type IShopOrderStart = Schemas['ShopOrderStart'];

// The two shop enums come across as their numbers, which is what the wire carries. Naming them here
// keeps `state === 2` out of the pages — see `ShopProductKind` / `ShopOrderState` in the emulator's
// Vortex.Primitives/Shop/ShopContracts.cs, which is where the numbers are decided.
export const SHOP_KIND = {
    CREDITS: 0,
    DUCKETS: 1,
    DIAMONDS: 2,
    CLUB: 3,
    CLUB_VIP: 4,
} as const;

export const SHOP_ORDER = {
    PENDING: 0,
    PAID: 1,
    FULFILLED: 2,
    CANCELLED: 3,
    NEEDS_INTERVENTION: 4,
} as const;

// The API's refusal codes, worded.
//
// A key wherever habbo.com has one — and it has one for most of these, which is the point: the
// hotel's own sentence for "that is not your current password" is
// `ERROR_INCORRECT_PASSWORD`, and writing a shorter French one here would be inventing wording that
// already exists, in a file (`fr.json`) that is also where a second language would come from.
//
// A literal only where habbo.com has nothing, because its own API never answers that case: a hotel
// outage, a withdrawn shop product, an order id that is not yours. Those are ours to word.
const ERRORS: Record<string, string> = {
    'pocket.auth.missing_credentials': 'Il manque ton nom ou ton mot de passe.',
    'pocket.auth.invalid_login': 'Nom ou mot de passe incorrect.',
    'pocket.auth.mfa_required': 'Entre le code de ton application d\'authentification.',
    'pocket.auth.invalid_code': t('TWO_FACTOR_AUTHENTICATION_INCORRECT_CODE'),
    // Refused because the account already has a factor. habbo.com never answers this — its own
    // enrolment replaces rather than refuses — so the sentence is ours.
    'pocket.auth.mfa_already_enabled': 'Ce compte a deja une authentification a deux facteurs.',
    // habbo.com's own key for a refused challenge, and its own sentence.
    'safetylock.invalid_answer': t('ERROR_SAFETY_LOCK_ANSWER'),
    'safetylock.not_configured': 'Ce compte n\'a pas de questions de securite.',
    // Never rendered: `needsSafetyUnlock` catches this one and opens the dialog instead, the way
    // `needsMfa` catches the second factor. The wording is here for the path that forgets to.
    'safetylock.required': 'Reponds a tes questions de securite pour continuer.',
    'pocket.auth.password_too_short': t('ERROR_PASSWORD_MIN_LENGTH'),
    'pocket.auth.wrong_password': t('ERROR_INCORRECT_PASSWORD'),
    'pocket.auth.no_avatars': 'Ce compte n\'a pas encore d\'avatar.',
    'pocket.auth.name_taken': t('ERROR_FIELD_NAME_TAKEN'),
    'email_taken': t('ERROR_EMAIL_CHANGE_USED'),
    'avatar_not_owned': 'Cet avatar n\'appartient pas a ce compte.',
    'invalid_request': 'Requete invalide.',
    'article_not_found': 'Cet article n\'existe pas.',
    'hotel_unreachable': 'L\'hotel ne repond pas.',
    'order_not_found': 'Cette commande n\'existe pas.',
    'unknown_product': 'Ce produit n\'est plus en vente.',
    'too_many_open_orders': 'Tu as trop de commandes en attente. Termine-les d\'abord.',
    'shop_unavailable': 'La boutique n\'est pas disponible pour le moment.',
    // The voucher codes are the GRAIN's own, so the client's redeem dialog and this page say the
    // same thing about the same code. habbo.com words three of the five; `inactive` and
    // `max_redemptions_reached` are this emulator's own refusals and have no counterpart.
    'not_found': t('ERROR_VOUCHER_CODE_NONEXISTENT'),
    'already_redeemed': t('ERROR_VOUCHER_CODE_REDEEMED'),
    'grant_failed': t('ERROR_VOUCHER_CODE_FAILED'),
    'inactive': 'Ce code n\'est plus actif.',
    'expired': 'Ce code a expire.',
    'max_redemptions_reached': 'Ce code a atteint sa limite d\'utilisations.',
};

export class ApiError extends Error
{
    public readonly code: string;
    public readonly status: number;

    constructor(code?: string | null, status?: number, options: {cause?: unknown} = {})
    {
        super(ERRORS[code ?? ''] ?? code ?? 'La connexion a echoue.');
        this.name = 'ApiError';
        this.code = code ?? 'request_failed';
        this.status = status ?? 0;

        if(options.cause)
        {
            this.cause = options.cause;
        }
    }
}

// `unknown`, not `ApiError`: both of these are called from a `catch`, where TypeScript hands you
// `unknown` and asking what it was is the entire job.
export function isAuthError(error: unknown): boolean
{
    return (error as ApiError | null)?.status === 401;
}

export function needsMfa(error: unknown): boolean
{
    return (error as ApiError | null)?.code === 'pocket.auth.mfa_required';
}

interface IRequestOptions
{
    method?: string;
    body?: unknown;
}

// The caller names what the route answers. It is an assertion and not a validation — nothing here
// parses the payload — so the type is only as true as the C# record it was copied from. That is the
// contract worth stating out loud: `WebApiEndpoints.cs` is its other half.
async function request<T>(path: string, options: IRequestOptions = {}): Promise<T>
{
    let response: Response;

    try
    {
        response = await fetch(path, {
            credentials: 'same-origin',
            headers: options.body ? {'Content-Type': 'application/json'} : undefined,
            method: options.method,
            body: options.body ? JSON.stringify(options.body) : undefined,
        });
    }
    catch (cause)
    {
        // The hotel being down and the hotel refusing you are different screens, so the transport
        // failure keeps its own code rather than collapsing into a generic error.
        throw new ApiError('hotel_unreachable', 0, {cause});
    }

    // The endpoints that answer a bare `{}` parse to something empty-but-fine; a body that is not
    // JSON at all is a proxy or a crash, never the API.
    let payload: unknown;

    try
    {
        payload = await response.json();
    }
    catch
    {
        payload = null;
    }

    if(!response.ok)
    {
        throw new ApiError((payload as {error?: string} | null)?.error, response.status);
    }

    return payload as T;
}

export function hello(): Promise<{status: string}>
{
    return request('/api/public/info/hello');
}

// The languages the hotel publishes in.
export function getLanguages(): Promise<ISiteLanguages>
{
    return request('/api/public/languages');
}

// Anonymous by design — the front page has to render with no session at all — and the server does
// the ordering: pinned first, then newest. `lang` in the answer is the language actually served,
// which may not be the one asked for; a summary then carries `fallback: true`.
export function getArticles(
    options: {category?: string; page?: number; pageSize?: number} = {}
): Promise<IArticleFeed>
{
    const query = new URLSearchParams();

    if(options.category && options.category !== 'tout')
    {
        query.set('category', options.category);
    }

    if(options.page)
    {
        query.set('page', String(options.page));
    }

    if(options.pageSize)
    {
        query.set('pageSize', String(options.pageSize));
    }

    const suffix = query.size ? `?${query}` : '';

    return request(`/api/public/articles${suffix}`);
}

// 404 `article_not_found` when there is none. `body` is the stored block array — never HTML. See
// components/ArticleBody.svelte.
export function getArticle(slug: string): Promise<IArticleDetail>
{
    return request(`/api/public/articles/${encodeURIComponent(slug)}`);
}

// 404 `user_not_found`. habbo.com's own two-step: the site routes on /profile/:name and the profile
// read takes the id this hands back.
export function getUser(name: string): Promise<IProfileUser>
{
    return request(`/api/public/users?name=${encodeURIComponent(name)}`);
}

// Anonymous: a profile is a page a signed-out visitor can open. A badge carries its CODE and no
// label — the hotel's badge texts are not in the database, they are `badge_<code>_name` in the asset
// host's external_flash_texts (see lib/badges.ts).
//
// A player who has hidden their profile answers with the header and four EMPTY lists. That is the
// honest answer to a visitor and the wrong one for the owner — see getOwnProfile().
export function getProfile(uniqueId: string): Promise<IPlayerProfile>
{
    return request(`/api/public/users/${encodeURIComponent(uniqueId)}/profile`);
}

// The signed-in avatar's own profile, hidden or not, and habbo.com's own route for it. Its
// `ProfileController` picks between the two on
// `Session.hasSession() && profile.uniqueId === user.uniqueId`, and this is why: hiding a profile
// hides it from VISITORS, and showing its owner "this profile is private" about themselves turns a
// setting into what looks like a malfunction.
//
// It takes no id. One would make it "read anyone's profile ignoring their privacy setting".
export function getOwnProfile(): Promise<IPlayerProfile>
{
    return request('/api/user/profile');
}

// Busiest first. A room whose door is invisible is in neither this nor getRoom(): the web API would
// otherwise walk around the door the client enforces.
export function getRooms(options: {page?: number; pageSize?: number} = {}): Promise<IRoomPage>
{
    const query = new URLSearchParams();

    if(options.page)
    {
        query.set('page', String(options.page));
    }

    if(options.pageSize)
    {
        query.set('pageSize', String(options.pageSize));
    }

    const suffix = query.size ? `?${query}` : '';

    return request(`/api/public/rooms${suffix}`);
}

// 404 `room_not_found` for a room that does not exist OR whose door is invisible.
export function getRoom(id: number | string): Promise<IRoomSummary>
{
    return request(`/api/public/rooms/${encodeURIComponent(id)}`);
}

// The SELECTED avatar's wallet, falling back to the account's first. 401 when signed out.
export function getPurse(): Promise<IPlayerPurse>
{
    return request('/api/user/purse');
}

// What the hotel sells. Anonymous: the store page renders for a visitor who has not signed in.
export function getShopProducts(): Promise<IShopCatalog>
{
    return request('/api/public/shop/products');
}

// A PRODUCT CODE and nothing else. The amount and the price are read server-side off the product
// row and snapshot onto the order — sending them from here would be a request field somebody can
// edit, which is exactly what the API refuses to have.
//
// Answers the order plus where to pay. `redirectUrl` is null when the hotel's provider hosts no
// payment page (the `manual` one does not), and the page then shows the order as pending rather
// than navigating nowhere.
export function startShopOrder(productCode: string): Promise<IShopOrderStart>
{
    return request('/api/user/shop/orders', {method: 'POST', body: {productCode}});
}

// This avatar's orders, newest first. 401 signed out.
export function getShopOrders(): Promise<IShopOrder[]>
{
    return request('/api/user/shop/orders');
}

// One order's STATE. This is what the page a payment provider sends the browser back to reads: it
// reports, it never grants — the credits arrive on a signed webhook the browser has no part in. A
// 404 covers both "no such order" and "not yours".
export function getShopOrder(orderId: string): Promise<IShopOrder>
{
    return request(`/api/user/shop/orders/${encodeURIComponent(orderId)}`);
}

// A prepaid code. Refusals carry the grain's own code (`expired`, `already_redeemed`, …), which
// ERRORS above turns into French.
export function redeemVoucher(code: string): Promise<IEmptyResponse>
{
    return request('/api/user/shop/voucher', {method: 'POST', body: {code}});
}

// A 401 carrying `pocket.auth.mfa_required` is not a refusal, it is the server asking for the second
// factor — see needsMfa().
export function login(email: string, password: string, code?: string): Promise<ILoginResponse>
{
    return request('/api/public/authentication/login', {
        method: 'POST',
        body: {email, password, ...(code ? {code} : {})},
    });
}

// The server logs the new account in as part of the same call, so there is no second round trip and
// the cookie is already set when this resolves.
export function register(
    email: string,
    password: string,
    passwordRepeated: string
): Promise<IRegistrationResponse>
{
    return request('/api/public/registration/new', {
        method: 'POST',
        body: {email, password, passwordRepeated},
    });
}

export function logout(): Promise<IEmptyResponse>
{
    return request('/api/public/authentication/logout', {method: 'POST'});
}

// -> { sessionsRevoked }. Note this ends EVERY session of the account including the caller's: the
// endpoint clears the cookie itself, so the page must return to the landing screen afterwards.
export function changePassword(
    currentPassword: string,
    newPassword: string,
    code?: string
): Promise<IPasswordChangeResponse>
{
    return request('/api/public/authentication/password', {
        method: 'POST',
        body: {currentPassword, newPassword, ...(code ? {code} : {})},
    });
}

export function getAvatars(): Promise<IAvatarInfo[]>
{
    return request('/api/user/avatars');
}

// The refreshed list, same shape as getAvatars().
export function createAvatar(name: string, figure: string, gender: string): Promise<IAvatarInfo[]>
{
    return request('/api/user/avatars', {method: 'POST', body: {name, figure, gender}});
}

// Which avatar the next SSO ticket belongs to. The choice is stored server-side on the session and
// is never read back, so lib/session.ts keeps its own copy for the UI.
export function selectAvatar(uniqueId: string): Promise<IEmptyResponse>
{
    return request('/api/user/avatars/select', {method: 'POST', body: {uniqueId}});
}

// The ticket the client trades for a connection; it is single-use, so /hotel asks for a fresh one on
// every mount.
export function ssoToken(uniqueId?: string): Promise<ISsoTicketResponse>
{
    const query = uniqueId ? `?uniqueId=${encodeURIComponent(uniqueId)}` : '';

    return request(`/api/ssotoken${query}`);
}

export function checkName(name: string): Promise<INameCheckResponse>
{
    return request('/api/newuser/name/check', {method: 'POST', body: {name}});
}

// A name already taken is a **409**, so it arrives here as a thrown ApiError carrying
// `pocket.auth.name_taken` — not, as this comment claimed until the contract was generated, a 200
// with an error in the body. Nothing read it that way, which is how the claim survived.
export function selectName(name: string, playerId: number): Promise<INameSelectResponse>
{
    return request('/api/newuser/name/select', {method: 'POST', body: {name, playerId}});
}

// The account safety lock. While it is on the account cannot spend, and the SERVER enforces it —
// the client's own hidden screens are a courtesy, not the lock.
export function getSafetyLock(): Promise<ISafetyLock>
{
    return request('/api/user/safetylock');
}

// The password is required in both directions: a thief holding the session must not be able to
// throw the lock either.
export function setSafetyLock(
    locked: boolean,
    currentPassword: string,
    code?: string
): Promise<ISafetyLock>
{
    return request('/api/user/safetylock', {
        method: 'POST',
        body: {locked, currentPassword, ...(code ? {code} : {})},
    });
}

// The sign-in address. `verified` is always false — nothing in this hotel can send to an address,
// so none was ever confirmed, and there is no resend route to call.
export function getEmail(): Promise<IAccountEmail>
{
    return request('/api/user/email');
}

// 409 `email_taken` when another account already signs in with it; 400 for a wrong password, a
// second factor still owed (`pocket.auth.mfa_required`) or an address that is not one.
export function changeEmail(
    currentPassword: string,
    email: string,
    code?: string
): Promise<IAccountEmail>
{
    return request('/api/user/email/change', {
        method: 'POST',
        body: {currentPassword, email, ...(code ? {code} : {})},
    });
}

// The selected avatar's preferences. One field: `profileVisible`. habbo.com's own privacy form
// carries six more and none of them has anywhere to be stored here — see PlayerPreferencesResponse.
export function getPreferences(): Promise<IPlayerPreferences>
{
    return request('/api/user/preferences');
}

export function savePreferences(profileVisible: boolean): Promise<IPlayerPreferences>
{
    return request('/api/user/preferences/save', {method: 'POST', body: {profileVisible}});
}

// The second factor. Enrolment is two calls on purpose: `startTwoFactor` hands out a secret and
// stores nothing, and only `enableTwoFactor` — which needs a code computed from it — writes it. A
// visitor who closes the dialog halfway has therefore not locked themselves out.
export function getTwoFactor(): Promise<ITwoFactorStatus>
{
    return request('/api/user/twofactor');
}

// 409 `pocket.auth.mfa_already_enabled` when one is already enrolled: replacing means disabling
// first, which demands a code from the factor being removed.
export function startTwoFactor(): Promise<ITwoFactorEnrolment>
{
    return request('/api/user/twofactor/startregistration', {method: 'POST'});
}

export function enableTwoFactor(secret: string, code: string): Promise<IEmptyResponse>
{
    return request('/api/user/twofactor/enable', {method: 'POST', body: {secret, code}});
}

export function disableTwoFactor(code: string): Promise<IEmptyResponse>
{
    return request('/api/user/twofactor/disable', {method: 'POST', body: {code}});
}

// The account's security questions — habbo.com's "Protection du compte". Four calls, and they split
// on what each demands: setting and clearing the questions change the recovery path and take the
// PASSWORD, answering the challenge takes the ANSWERS and nothing else.
//
// Only the question NUMBERS travel. Their wording is `IDENTITY_SAFETYQUESTION_<n>` in fr.json, so
// the pair an account chose reads in whatever language the visitor has — see lib/safety.ts.
export function getSafetyQuestions(): Promise<ISafetyQuestions>
{
    return request('/api/user/safetyquestions');
}

export function saveSafetyQuestions(
    question1: number,
    answer1: string,
    question2: number,
    answer2: string,
    currentPassword: string,
    code?: string
): Promise<IEmptyResponse>
{
    return request('/api/user/safetyquestions', {
        method: 'POST',
        body: {question1, answer1, question2, answer2, currentPassword, code},
    });
}

export function disableSafetyQuestions(currentPassword: string, code?: string): Promise<IEmptyResponse>
{
    return request('/api/user/safetyquestions/disable', {method: 'POST', body: {currentPassword, code}});
}

/** `trust` is habbo.com's radio pair: false unlocks this session only, true remembers the device. */
export function unlockSafetyQuestions(
    answer1: string,
    answer2: string,
    trust: boolean
): Promise<IEmptyResponse>
{
    return request('/api/user/safetyquestions/unlock', {method: 'POST', body: {answer1, answer2, trust}});
}

export function resetTrustedLocations(): Promise<ITrustedLocationsReset>
{
    return request('/api/user/trustedlocations/reset', {method: 'POST'});
}

/**
 * Whether a refusal is the server asking for the security questions rather than saying no. Same
 * shape as `needsMfa`: a challenge is a step, not a failure.
 */
export function needsSafetyUnlock(error: unknown): boolean
{
    return (error as ApiError | null)?.code === 'safetylock.required';
}

export function saveLook(
    figureString: string,
    gender: string,
    playerId: number
): Promise<IEmptyResponse>
{
    return request('/api/user/look/save', {method: 'POST', body: {figureString, gender, playerId}});
}
