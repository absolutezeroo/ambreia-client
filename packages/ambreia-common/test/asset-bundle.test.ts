// .ambreia bundles (assets-images / assets-xml, written by vortex-client/tools/bundle-assets.mjs):
// an "AMBB" header over the old entry table, the body deflated when that pays, `.png` keys that
// may hold lossless WebP.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {deflateRawSync} from 'node:zlib';
import {AssetBundle} from '../src/assets/AssetBundle';

function body(entries: Record<string, Uint8Array>): Buffer
{
    const records: Buffer[] = [];
    const data: Buffer[] = [];
    let offset = 0;

    for(const [key, bytes] of Object.entries(entries))
    {
        const name = Buffer.from(key);
        const record = Buffer.alloc(2 + name.length + 8);

        record.writeUInt16BE(name.length, 0);
        name.copy(record, 2);
        record.writeUInt32BE(offset, 2 + name.length);
        record.writeUInt32BE(bytes.length, 6 + name.length);
        records.push(record);
        data.push(Buffer.from(bytes));
        offset += bytes.length;
    }

    const header = Buffer.alloc(8);

    header.writeUInt32BE(1, 0);
    header.writeUInt32BE(records.length, 4);

    return Buffer.concat([header, ...records, ...data]);
}

function ambreia(content: Buffer, deflated: boolean): string
{
    const header = Buffer.alloc(8);

    header.write('AMBB', 0, 'latin1');
    header.writeUInt16BE(1, 4);
    header.writeUInt16BE(deflated ? 1 : 0, 6);

    return `data:application/octet-stream;base64,${Buffer.concat([header, deflated ? deflateRawSync(content) : content]).toString('base64')}`;
}

const webp = Buffer.from('RIFF\0\0\0\0WEBPVP8L', 'latin1');
const entries = {'window-layouts/a.xml': new TextEncoder().encode('<layout/>'), 'images/b.png': webp};

for(const deflated of [false, true])
{
    test(`an .ambreia bundle reads back (${deflated ? 'deflated' : 'plain'})`, async () =>
    {
        const bundle = await AssetBundle.load(ambreia(body(entries), deflated));

        assert.equal(bundle.getText('window-layouts/a.xml'), '<layout/>');
        assert.deepEqual(bundle.listKeys('images/'), ['images/b.png']);
        // The key keeps `.png`; the blob is typed from its bytes so the browser decodes it as WebP.
        assert.equal(bundle.getBlob('images/b.png')?.type, 'image/webp');
        assert.equal(bundle.getBlob('window-layouts/a.xml')?.type, 'text/xml');
    });
}

test('anything else is refused with a clear error', async () =>
{
    await assert.rejects(AssetBundle.load(`data:text/html;base64,${Buffer.from('<!DOCTYPE html>').toString('base64')}`), /Not an \.ambreia bundle/);
});
