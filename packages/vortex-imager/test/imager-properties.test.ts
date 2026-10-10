// The imager's hotel properties: `${key}` interpolation as the client's configuration manager does
// it, read by the room engine and the routes, with no DI container behind them (AV-02).
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ImagerProperties} from '../src/ImagerProperties';

test('a property interpolates ${key} through several levels, and caches the result', () =>
{
    const properties = new ImagerProperties({
        'url.prefix': 'http://assets',
        'flash.client.url': '${url.prefix}/gordon/build-1/',
        'furnidata.load.url': '${flash.client.url}furnidata',
        'gpu.ignored_furni': ''
    });

    assert.equal(properties.getProperty('furnidata.load.url'), 'http://assets/gordon/build-1/furnidata');
    assert.equal(properties.getProperty('furnidata.load.url'), 'http://assets/gordon/build-1/furnidata');
    assert.equal(properties.getProperty('gpu.ignored_furni'), '');
    assert.equal(properties.getProperty('nothing'), '');
    assert.equal(properties.has('url.prefix'), true);
    assert.equal(properties.has('nothing'), false);
});

test('an unknown key empties the whole value, a protocol-relative URL becomes https, booleans read 1 and true', () =>
{
    const properties = new ImagerProperties({
        'image.library.url': '${nowhere}/c_images/',
        'image.library.badgepart.url': '//cdn.example/badges/',
        'extra_data_batches_enabled': 'true',
        'zoom.enabled': '1',
        'room.dragging.always_center': '0'
    });

    assert.equal(properties.getProperty('image.library.url'), '');
    assert.equal(properties.getProperty('image.library.badgepart.url'), 'https://cdn.example/badges/');
    assert.equal(properties.getBoolean('extra_data_batches_enabled'), true);
    assert.equal(properties.getBoolean('zoom.enabled'), true);
    assert.equal(properties.getBoolean('room.dragging.always_center'), false);
    assert.equal(properties.getBoolean('absent'), false);
    assert.equal(properties.interpolate('${zoom.enabled}-${zoom.enabled}'), '1-1');
});
