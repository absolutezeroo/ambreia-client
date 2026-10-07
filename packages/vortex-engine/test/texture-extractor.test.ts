import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {Container} from 'pixi.js';
import {extractCanvas, setTextureExtractor} from '@ambreia/iso/renderer/TextureExtractor';

const target = {} as Container;

test('no extractor: nothing to read pixels with, so null', () =>
{
    setTextureExtractor(null);
    assert.equal(extractCanvas(target), null);
});

test('the extractor set by the host is the one used', () =>
{
    const canvas = {} as HTMLCanvasElement;

    setTextureExtractor(t => (t === target ? canvas : null));
    assert.equal(extractCanvas(target), canvas);
    setTextureExtractor(null);
});

test('an extractor that throws gives null, as the old try/catch did', () =>
{
    setTextureExtractor(() => { throw new Error('no renderer'); });
    assert.equal(extractCanvas(target), null);
    setTextureExtractor(null);
});
