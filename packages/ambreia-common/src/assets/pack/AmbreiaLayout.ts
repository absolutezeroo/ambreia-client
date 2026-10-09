/**
 * Where each file of an .ambreia directory lives and how it is stored (plan 2026-10-08-asset-packs,
 * protection). Plain: readable names and bytes. Encrypted, from a 32-byte master key through
 * HKDF-SHA256 (WebCrypto, the same in Node and in the browser):
 * - names are `hex(HMAC(logical path))[0..32]`, so knowing a piece's name says nothing of what to
 *   request;
 * - each file is `iv(12) ‖ AES-256-GCM(bytes)` under its own derived key, with the logical path as
 *   associated data, so a file served under another's name does not decrypt.
 * The key only keeps out whoever does not have it: a client that renders a piece holds both.
 */
export type LogicalPath =
    | {kind: 'piece'; name: string}
    | {kind: 'image'; sha1: string; format: 'webp' | 'png'}
    | {kind: 'dictionary'; id: string};

export interface IAmbreiaLayout
{
    readonly encrypted: boolean;
    /** 16 hex characters identifying the master key (null when plain). */
    readonly keyId: string | null;
    /** The file's path inside the directory, `/`-separated, not URL-encoded. */
    path(logical: LogicalPath): Promise<string>;
    seal(logical: LogicalPath, bytes: Uint8Array): Promise<Uint8Array>;
    open(logical: LogicalPath, bytes: Uint8Array): Promise<Uint8Array>;
}

const logicalName = (logical: LogicalPath): string =>
    logical.kind === 'piece' ? `piece/${logical.name}` : logical.kind === 'image' ? `image/${logical.sha1}` : `dictionary/${logical.id}`;

const hex = (bytes: ArrayBuffer | Uint8Array): string => Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
const utf8 = (text: string): Uint8Array<ArrayBuffer> => new TextEncoder().encode(text);
const buffer = (bytes: Uint8Array): Uint8Array<ArrayBuffer> => bytes as Uint8Array<ArrayBuffer>;

export function plainLayout(): IAmbreiaLayout
{
    return {
        encrypted: false,
        keyId: null,
        path: async logical => logical.kind === 'piece' ? `${logical.name}.ambreia` : logical.kind === 'image' ? `images/${logical.sha1}.${logical.format}` : `dictionary/${logical.id}.bin`,
        seal: async (_logical, bytes) => bytes,
        open: async (_logical, bytes) => bytes
    };
}

export function generateMasterKey(): Uint8Array
{
    return crypto.getRandomValues(new Uint8Array(32));
}

/** base64url, as it goes in a key file or in config.json. */
export function encodeMasterKey(key: Uint8Array): string
{
    return btoa(String.fromCharCode(...key)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeMasterKey(text: string): Uint8Array
{
    const binary = atob(text.trim().replace(/-/g, '+').replace(/_/g, '/'));
    const key = Uint8Array.from(binary, char => char.charCodeAt(0));

    if(key.length !== 32) throw new Error(`An .ambreia master key is 32 bytes, this one is ${key.length}`);

    return key;
}

export async function encryptedLayout(masterKey: Uint8Array): Promise<IAmbreiaLayout>
{
    // A browser hides WebCrypto off a secure origin: say so rather than fail on `undefined.importKey`.
    if(!globalThis.crypto?.subtle) throw new Error('WebCrypto is unavailable: the page is not a secure origin (https or localhost)');

    const subtle = crypto.subtle;
    const master = await subtle.importKey('raw', buffer(masterKey), 'HKDF', false, ['deriveKey', 'deriveBits']);
    const hkdf = (info: string): HkdfParams => ({name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(), info: utf8(info)});
    const names = await subtle.deriveKey(hkdf('ambreia-names'), master, {name: 'HMAC', hash: 'SHA-256', length: 256}, false, ['sign']);
    const keyId = hex(await subtle.deriveBits(hkdf('ambreia-key-id'), master, 64));
    const fileKey = (logical: LogicalPath): Promise<CryptoKey> =>
        subtle.deriveKey(hkdf(`ambreia-file:${logicalName(logical)}`), master, {name: 'AES-GCM', length: 256}, false, ['encrypt', 'decrypt']);

    return {
        encrypted: true,
        keyId,
        path: async (logical) =>
        {
            const name = hex(await subtle.sign('HMAC', names, utf8(logicalName(logical)))).slice(0, 32);

            return logical.kind === 'piece' ? `${name}.ambreia` : logical.kind === 'image' ? `images/${name}.bin` : `dictionary/${name}.bin`;
        },
        seal: async (logical, bytes) =>
        {
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const sealed = new Uint8Array(await subtle.encrypt({name: 'AES-GCM', iv, additionalData: utf8(logicalName(logical))}, await fileKey(logical), buffer(bytes)));
            const out = new Uint8Array(12 + sealed.length);

            out.set(iv, 0);
            out.set(sealed, 12);

            return out;
        },
        open: async (logical, bytes) => new Uint8Array(await subtle.decrypt(
            {name: 'AES-GCM', iv: buffer(bytes.slice(0, 12)), additionalData: utf8(logicalName(logical))},
            await fileKey(logical),
            buffer(bytes.slice(12))
        ))
    };
}
