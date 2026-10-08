import {test} from 'node:test';
import assert from 'node:assert/strict';
import {AssetLibrary} from '@ambreia/common/assets/AssetLibrary';
import {setPlatform, BROWSER_PLATFORM} from '@ambreia/common/platform/Platform';
import {AvatarRenderManager} from '../src/AvatarRenderManager';
import {readAvatarData, AVATAR_DATA_FILES, AVATAR_ACTION_OFFSET_FILES} from '../src/AvatarData';

// No DOM here: the constructor's parse of the shipped data gets an empty document.
const EMPTY_DOCUMENT = {documentElement: null, getElementsByTagName: () => [], querySelectorAll: () => []} as unknown as Document;

test('the render manager is built from options alone and owns its events', () =>
{
    setPlatform({...BROWSER_PLATFORM, parseXml: () => EMPTY_DOCUMENT});

    try
    {
        const manager = new AvatarRenderManager({assets: new AssetLibrary('avatar'), data: readAvatarData(() => ''), downloadUrl: '', downloadNameTemplate: ''});

        assert.equal(manager.isReady, false);
        assert.equal(typeof manager.events.on, 'function');
        manager.dispose();
        assert.equal(manager.disposed, true);
    }
    finally
    {
        setPlatform(BROWSER_PLATFORM);
    }
});

test('the avatar data names every missing file at once', () =>
{
    const files = [...Object.values(AVATAR_DATA_FILES), ...Object.values(AVATAR_ACTION_OFFSET_FILES)];

    assert.throws(() => readAvatarData(file => file === 'AmbreiaAvatarGeometry.xml' ? '<geometry/>' : null),
        error => files.filter(file => file !== 'AmbreiaAvatarGeometry.xml').every(file => (error as Error).message.includes(file)));

    const data = readAvatarData(file => file);

    assert.equal(data.geometry, 'AmbreiaAvatarGeometry.xml');
    assert.equal(data.actionOffsets.swim, 'AmbreiaActionOffsetSwim.xml');
});
