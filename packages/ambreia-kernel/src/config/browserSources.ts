import type {IConfigSource} from './loadConfig';
import {ConfigError} from './ConfigError';

/**
 * The socket a page served from this machine dials: the hotel's dev server. Served from anywhere
 * else (a phone on the LAN, a tunnel, the deployment), the page dials back through its own origin,
 * which the website proxies at /ws. Moved from index.html (J5); a deployment overrides it in
 * config.json (`app.server.host`).
 */
export const DEV_SERVER_HOST = 'ws://ourvjasausgxlxmrunm7ys1w.72.60.91.223.sslip.io';

/** The parts of `window.location` the defaults are computed from. */
export interface IPageLocation
{
    hostname: string;
    protocol: string;
    host: string;
    search: string;
}

/**
 * The three sources of the client's configuration, in order (spec §5.4): defaults computed from
 * the page, the deployment's config.json (null when there is none), and the URL parameters the
 * website hands over (`?sso=`, `?link=`).
 */
export function browserSources(location: IPageLocation, configJson: unknown): IConfigSource[]
{
    const host = ['localhost', '127.0.0.1'].includes(location.hostname)
        ? DEV_SERVER_HOST
        : `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`;
    const query = new URLSearchParams(location.search);
    const url: Record<string, string> = {};
    // `${url.prefix}` in the legacy properties is the page's own origin unless config.json says
    // otherwise: the client is served at its root, under the site's /client and through tunnels.
    const sources: IConfigSource[] = [{name: 'defaults', values: {app: {server: {host}}, legacy: {'url.prefix': `${location.protocol}//${location.host}`}}}];

    if(configJson !== null && configJson !== undefined)
    {
        if(typeof configJson !== 'object' || Array.isArray(configJson)) throw new ConfigError(['config.json: not an object']);

        sources.push({name: 'config.json', values: configJson as Record<string, unknown>});
    }

    const sso = query.get('sso');
    const link = query.get('link');

    if(sso) url.sso = sso;
    if(link) url.startLink = link;

    sources.push({name: 'url', values: {app: url}});

    return sources;
}

/** The text of config.json (null when the deployment has none), parsed; unreadable = named. */
export function parseConfigJson(text: string | null): unknown
{
    if(text === null) return null;

    try
    {
        return JSON.parse(text) as unknown;
    }
    catch (error)
    {
        throw new ConfigError([`config.json: ${(error as Error).message}`]);
    }
}
