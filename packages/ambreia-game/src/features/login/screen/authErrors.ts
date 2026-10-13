/** The server's codes and the form's own, to the text shown for them. */
const ERROR_KEYS: Readonly<Record<string, string>> = {
    'pocket.auth.login_failed': 'vortex.auth.error.credentials',
    'pocket.auth.invalid_login': 'vortex.auth.error.credentials',
    'pocket.auth.missing_credentials': 'vortex.auth.error.credentials',
    'pocket.auth.email_already_taken': 'vortex.auth.error.email_taken',
    'pocket.auth.password_too_short': 'vortex.auth.error.password_short',
    'pocket.auth.password_too_long': 'vortex.auth.error.password_long',
    email_invalid: 'vortex.auth.field.invalid',
    password_mismatch: 'vortex.auth.field.mismatch',
    terms_not_accepted: 'vortex.auth.error.terms',
    rate_limited: 'vortex.auth.error.rate_limited',
    network: 'vortex.auth.error.network'
};

/** The text key for a refusal's code; the generic error for one the client does not know. */
export function authErrorKey(code: string): string
{
    return ERROR_KEYS[code] ?? 'vortex.auth.error.unknown';
}
