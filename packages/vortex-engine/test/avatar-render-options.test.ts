import {test} from 'node:test';
import assert from 'node:assert/strict';
import {AssetLibrary} from '@ambreia/common/assets/AssetLibrary';
import {setPlatform, BROWSER_PLATFORM} from '@ambreia/common/platform/Platform';
import {AvatarRenderManager} from '../src/habbo/avatar/AvatarRenderManager';

// No DOM here: the embedded-XML step of the constructor parses into an empty document.
const EMPTY_DOCUMENT = {documentElement: null, getElementsByTagName: () => [], querySelectorAll: () => []} as unknown as Document;

test('the render manager is built from options alone and owns its events', () =>
{
    setPlatform({...BROWSER_PLATFORM, parseXml: () => EMPTY_DOCUMENT});

    try
    {
        const manager = new AvatarRenderManager({assets: new AssetLibrary('avatar'), downloadUrl: '', downloadNameTemplate: '', figureMapUrl: ''});

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
