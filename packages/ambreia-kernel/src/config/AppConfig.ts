import {z} from 'zod';

/**
 * The `app` section (spec §5): what the client needs before any feature — where the server is,
 * and what the page was opened with. Defaults computed from the page come from browserSources().
 * Strict, like every section: a misspelt key is an error, not a silently ignored one.
 */
export const AppSection = z.strictObject({
    server: z.strictObject({
        /** A full `ws(s)://` URL, or a host the ports are tried on. */
        host: z.string().min(1),
        ports: z.array(z.number().int().positive()).default([40001])
    }),
    /** The session ticket the website hands over (`?sso=`). */
    sso: z.string().optional(),
    /** An internal link fired once the session is up (`?link=navigator/goto/42`). */
    startLink: z.string().optional(),
    /** The legacy `external_variables` URL, when it is not the hotel's default one. */
    configurationUrl: z.string().optional()
});

export type AppConfig = z.infer<typeof AppSection>;

/**
 * The old `key=value` properties (§5, migration): read through the configuration manager's
 * `getProperty()`. Each feature that migrates takes its keys out; when it is empty, it goes.
 */
export const LegacySection = z.record(z.string(), z.string());
