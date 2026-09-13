// `common/form/password-new/password-new.html` and `common/form/email-address/email-address.html`:
// the vocabulary habbo.com answers a bad password or a bad address with. It lists SIX messages for
// the password field and each says what is actually wrong — too short, too long, the wrong shape,
// it contains your name, it contains your e-mail, you have used it before — where this port had one
// generic sentence for all of them. Same defect as the avatar name, one form over.
//
// TWO THINGS MATTER MORE THAN THE WORDING, and both are about not lying to the visitor.
//
// 1. NONE OF THIS IS ENFORCEMENT. The server decides; this only says so earlier. A rule here that is
//    STRICTER than the server's costs a visitor a good password and nothing else. A rule here that
//    is LAXER hands them a green field and then a refusal they cannot explain — which is exactly
//    what this port was doing, see (2).
//
// 2. THE NUMBERS ARE OURS, NOT HABBO'S. `ERROR_PASSWORD_MIN_LENGTH` reads "au moins 6 caractères"
//    and `PASSWORD_CHANGE_HELP` says the same; this hotel's floor is EIGHT
//    (`PasswordChangeResult.MINIMUM_LENGTH`, applied by both the change route and registration).
//    Quoting habbo's sentence would tell a visitor that a 7-character password is fine and let the
//    server refuse it. So the two messages carrying a number are worded here, and the four that
//    carry none are habbo.com's own keys.
import {t} from './i18n.js';

/**
 * The server's floor, mirrored. `PasswordChangeResult.MINIMUM_LENGTH` is the single constant both
 * the change route and `WebApiAuthService.RegisterAsync` test against, so this is the one number
 * that must not drift — if it moves there, it moves here.
 */
export const PASSWORD_MIN_LENGTH = 8;

/**
 * BCrypt hashes the first 72 BYTES and ignores the rest, so a longer secret is not the stronger one
 * the visitor thinks they chose. The server refuses rather than truncating; this says so first.
 *
 * Counted in bytes and not characters on purpose: "é" is two, an emoji is four, and a 40-character
 * passphrase can be past the limit while looking nowhere near it.
 */
export const PASSWORD_MAX_BYTES = 72;

/**
 * What is wrong with a password, or nothing. Returns the MESSAGE rather than a key because two of
 * the six are worded here — see the note at the top about the numbers.
 *
 * `name` and `email` are the visitor's own, when the form knows them: registration has both,
 * the change form has neither until the profile has loaded. Absent means the check is skipped,
 * never that it passed.
 */
export function passwordProblem(
    password: string,
    who: {name?: string; email?: string} = {}
): string | null
{
    if(!password)
    {
        return t('ERROR_FIELD_REQUIRED');
    }

    if(password.length < PASSWORD_MIN_LENGTH)
    {
        return `Trop facile, le mot de passe doit etre plus long, avec au moins ${PASSWORD_MIN_LENGTH} caracteres.`;
    }

    if(new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES)
    {
        return `Ton mot de passe est trop long. Il peut contenir ${PASSWORD_MAX_BYTES} octets maximum.`;
    }

    // habbo.com's `habbo-password-pattern`: at least one letter, and at least one digit or symbol.
    // The server does NOT enforce this — it checks length alone — so this is a nudge and not a gate,
    // and it is safe to keep because it can only refuse what the server would have accepted.
    if(!/[a-zA-Z]/.test(password) || !/[^a-zA-Z]/.test(password))
    {
        return t('ERROR_PASSWORD_PATTERN');
    }

    const lowered = password.toLowerCase();

    if(who.name && who.name.length >= 3 && lowered.includes(who.name.toLowerCase()))
    {
        return t('ERROR_PASSWORD_CONTAINS_NAME');
    }

    // The local part, not the whole address: "@example.com" is in everybody's address and would
    // refuse half the passwords on the hotel for nothing.
    const local = (who.email ?? '').split('@')[0] ?? '';

    if(local.length >= 3 && lowered.includes(local.toLowerCase()))
    {
        return t('ERROR_PASSWORD_CONTAINS_EMAIL');
    }

    return null;
}

/**
 * `ERROR_PASSWORD_USED_EARLIER` has no counterpart here and cannot have one: habbo.com answers it
 * from the server (`remoteDataPasswordUsed`), against a history of previous hashes. This emulator
 * stores one `password_hash` per account and no history, so nothing can tell whether a password was
 * used before — and a client that guessed would be inventing an answer about the visitor's own past.
 */
export const PASSWORD_HISTORY_UNSUPPORTED = true;

/** habbo.com's five ratings, worst first. The index IS the score. */
const RATINGS = ['FAIL', 'POOR', 'FAIR', 'OK', 'GOOD'] as const;

export type IPasswordRating = (typeof RATINGS)[number];

/**
 * A deliberately CONSERVATIVE score, 0 to 4.
 *
 * ponytail: this is not zxcvbn — it has no dictionary, so it cannot tell that "Motdepasse1!" is
 * terrible. It is calibrated so that being wrong is being PESSIMISTIC: nothing under 12 characters
 * can reach the top two ratings whatever it contains, and a password built from one character class
 * or from one repeated character is pinned at the bottom. A meter that flatters a bad password is
 * worse than no meter, so the ceiling is low on purpose. Swap in zxcvbn if the dictionary is worth
 * the 400 KB.
 */
export function passwordScore(password: string): number
{
    if(!password)
    {
        return 0;
    }

    const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/]
        .filter((pattern) => pattern.test(password)).length;

    // One repeated character, however long. "aaaaaaaaaaaa" is not a passphrase.
    if(new Set(password).size <= 2)
    {
        return 0;
    }

    let score = 0;

    if(password.length >= PASSWORD_MIN_LENGTH) score++;
    if(password.length >= 12) score++;
    if(password.length >= 16) score++;
    if(classes >= 3) score++;

    // The ceiling that keeps the meter honest: length is the only thing this can measure properly,
    // so nothing short is allowed near the top however varied its characters are.
    if(password.length < 12)
    {
        score = Math.min(score, 1);
    }
    else if(password.length < 16)
    {
        score = Math.min(score, 2);
    }

    if(classes <= 1)
    {
        score = Math.min(score, 1);
    }

    return Math.max(0, Math.min(score, RATINGS.length - 1));
}

/** The score's rating name, for `PASSWORD_STRENGTH_RATING_<NAME>` and the indicator's class. */
export function strengthRating(score: number): IPasswordRating
{
    return RATINGS[Math.max(0, Math.min(score, RATINGS.length - 1))];
}

/** What is wrong with an address, or nothing. `type="email"` is not a check anything can rely on. */
export function emailProblem(email: string): string | null
{
    if(!email.trim())
    {
        return t('ERROR_FIELD_REQUIRED');
    }

    // Deliberately loose. The only authority on whether an address exists is a message sent to it,
    // and this hotel sends none — so the job here is to catch a typo, not to adjudicate RFC 5322.
    // A pattern that refuses a valid address is the expensive mistake; one that accepts an invalid
    // one costs a round-trip.
    return /^[^\s@]+@[^\s@.]+\.[^\s@]+$/.test(email.trim()) ? null : t('ERROR_EMAIL_INVALID');
}
