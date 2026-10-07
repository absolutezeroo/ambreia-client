import {test} from 'node:test';
import assert from 'node:assert/strict';
import {platform, setPlatform, BROWSER_PLATFORM, type IPlatform} from '../src/platform/Platform';
import {textureFromCanvas} from '../src/graphics/textureFromCanvas';
import {XmlAsset} from '../src/assets/XmlAsset';
import type {AssetTypeDeclaration} from '../src/assets/AssetTypeDeclaration';

const calls: string[] = [];
const FAKE: IPlatform = {
    createCanvas: (width, height) => { calls.push(`canvas ${width}x${height}`); return {width, height, getContext: () => null}; },
    decodeImage: async () => { throw new Error('unused'); },
    parseXml: text => { calls.push(`xml ${text.length}`); return {documentElement: {nodeName: 'root'}} as unknown as Document; }
};

test('setPlatform replaces the browser default', () =>
{
    setPlatform(FAKE);
    assert.equal(platform(), FAKE);
    setPlatform(BROWSER_PLATFORM);
});

test('a texture is built from a platform canvas without browser globals', () =>
{
    const texture = textureFromCanvas({width: 3, height: 2, getContext: () => null});

    assert.equal(texture.frame.width, 3);
    assert.equal(texture.frame.height, 2);
});

test('an XML asset parses through the platform', () =>
{
    calls.length = 0;
    setPlatform(FAKE);

    const asset = new XmlAsset({} as AssetTypeDeclaration);
    asset.setUnknownContent('<root/>');
    asset.prepareLazyContent();

    assert.deepEqual(calls, ['xml 7']);
    setPlatform(BROWSER_PLATFORM);
});
