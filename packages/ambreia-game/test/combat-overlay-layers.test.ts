// The combat overlay's layers (features/combat/overlay/): the floating numbers and the cast bars.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {IWindow} from '@ambreia/ui/IWindow';
import {CastBars} from '../src/features/combat/overlay/CastBars';
import {FloatingNumbers} from '../src/features/combat/overlay/FloatingNumbers';
import type {IAnchorSource} from '../src/features/combat/overlay/IAnchorSource';

type Fake = {visible: boolean; x: number; y: number; blend: number; width: number; color: number; caption: string; destroyed: boolean; fill?: Fake};

function fake(): Fake & IWindow
{
    const window = {visible: true, x: 0, y: 0, blend: 1, width: 36, color: 0, caption: '', destroyed: false, textColor: 0, fontSize: 0} as unknown as Fake & IWindow;

    (window as unknown as {destroy: () => void}).destroy = () => { window.destroyed = true; };
    (window as unknown as {findChildByName: () => unknown}).findChildByName = () => window.fill ??= fake();

    return window;
}

const AT_100: IAnchorSource = {getRpgAnchor: (_id, out) => { out.x = 100; out.y = 100; return true; }};
const point = {x: 0, y: 0};

test('a number waits for its blow to land, rises and fades, then is put aside for the next one', () =>
{
    const built: Fake[] = [];
    const numbers = new FloatingNumbers(() => { const window = fake(); built.push(window); return window; }, key => key);

    numbers.add(5, 12, 'hit', 0, 300, 0);
    assert.equal(numbers.tick(AT_100, point, 100), true);
    assert.equal(built[0].visible, false);

    numbers.tick(AT_100, point, 800);
    assert.equal(built[0].visible, true);
    assert.equal(built[0].caption, '-12');
    assert.equal(built[0].blend, 0.5);

    assert.equal(numbers.tick(AT_100, point, 1300), false);
    numbers.add(5, 3, 'miss', 0, 0, 1300);
    assert.equal(built.length, 1);
    assert.equal(built[0].caption, 'vortex.combat.miss');
});

test('a cast fills, a channel empties, and a cast whose end never came goes after its grace', () =>
{
    const bars: Fake[] = [];
    const casts = new CastBars(() => { const window = fake(); bars.push(window); return window; });

    casts.start(1, 1000, false, 0);
    casts.start(2, 1000, true, 0);
    casts.tick(AT_100, point, 250);
    assert.equal(bars[0].fill!.width, 9);
    assert.equal(bars[1].fill!.width, 27);

    assert.equal(casts.tick(AT_100, point, 2000), false);
    assert.deepEqual([bars[0].destroyed, bars[1].destroyed], [true, true]);
});
