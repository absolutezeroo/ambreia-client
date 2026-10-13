import type {IRegisterForm} from './IRegisterForm';

/** The server's rules (AccountPasswordRules, BCrypt's 72 bytes), checked before asking it. */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_BYTES = 72;

export function isEmail(value: string): boolean
{
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** 0 too short for the server, then 1 weak, 2 medium, 3 strong: length and kinds of characters. */
export function passwordStrength(password: string): 0 | 1 | 2 | 3
{
    if(password.length < PASSWORD_MIN_LENGTH) return 0;

    const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z\d]/].filter(kind => kind.test(password)).length;
    const score = kinds + (password.length >= 12 ? 1 : 0);

    return score >= 4 ? 3 : score >= 3 ? 2 : 1;
}

/** The first thing that stops the registration, as the error code shown for it; null when none. */
export function registerProblem(form: IRegisterForm): string | null
{
    if(!isEmail(form.email)) return 'email_invalid';
    if(form.password.length < PASSWORD_MIN_LENGTH) return 'pocket.auth.password_too_short';
    if(new TextEncoder().encode(form.password).length > PASSWORD_MAX_BYTES) return 'pocket.auth.password_too_long';
    if(form.password !== form.confirm) return 'password_mismatch';
    if(!form.acceptTerms || !form.acceptPrivacy) return 'terms_not_accepted';

    return null;
}
