import {z} from 'zod';
import {LANGUAGES} from '@ambreia/common/localization/Texts';

/**
 * The `app` section (spec §5): what the client needs before any feature — where the server is,
 * and what the page was opened with. Defaults computed from the page come from browserSources().
 * Strict, like every section: a misspelt key is an error, not a silently ignored one.
 */
export const AppSection = z.strictObject({
    server: z.strictObject({
        /** A full `ws(s)://` URL, or a host the ports are tried on. */
        host: z.string().min(1),
        ports: z.array(z.number().int().positive()).default([40001]),
        /**
         * The server's RSA public modulus (hex), when it is not the hotel's built-in one: a local
         * emulator signs with its own development key (appsettings.Development.json → Crypto).
         */
        rsaModulus: z.string().regex(/^[0-9A-Fa-f]{64,}$/, 'an RSA modulus in hexadecimal').optional()
    }),
    /** The session ticket the website hands over (`?sso=`). */
    sso: z.string().optional(),
    /** An internal link fired once the session is up (`?link=navigator/goto/42`). */
    startLink: z.string().optional(),
    /** The texts' language; the browser's when it is one of LANGUAGES, otherwise English. */
    language: z.enum(LANGUAGES).optional()
});

export type AppConfig = z.infer<typeof AppSection>;

/**
 * The old `key=value` properties (§5, migration): read through the configuration manager's
 * `getProperty()`. Each feature that migrates takes its keys out; when it is empty, it goes.
 */
export const LegacySection = z.record(z.string(), z.string());
