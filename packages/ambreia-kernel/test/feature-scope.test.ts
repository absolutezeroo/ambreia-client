// A feature hooks everything through its scope; one release() undoes it, last first, and a release
// that throws does not stop the others (spec §4: boot → dispose → boot leaves nothing behind).
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'eventemitter3';
import {FeatureScope} from '../src/feature/FeatureScope';

const root = globalThis as unknown as {__ambreia?: Record<string, unknown>};

test('bind() keeps the emitter typing and takes the listener off on release, in reverse order', () =>
{
    const emitter = new EventEmitter<{hit: [number]; miss: []}>();
    const scope = new FeatureScope();
    const order: string[] = [];
    const on = scope.bind(emitter);
    const once = scope.bindOnce(emitter);
    let total = 0;

    on('hit', (damage: number) => { total += damage; });
    once('miss', () => order.push('miss'));
    scope.add(() => order.push('first added'));
    scope.add(() => order.push('second added'));

    emitter.emit('hit', 3);
    assert.equal(total, 3);
    assert.equal(emitter.listenerCount('hit') + emitter.listenerCount('miss'), 2);

    scope.release();

    assert.equal(emitter.listenerCount('hit') + emitter.listenerCount('miss'), 0, 'listeners are off');
    assert.deepEqual(order, ['second added', 'first added']);
    emitter.emit('hit', 4);
    assert.equal(total, 3);
    assert.equal(scope.released, true);
});

test('a null emitter binds to nothing, like emitter?.on', () =>
{
    const scope = new FeatureScope();
    const on = scope.bind<EventEmitter<{x: []}>>(undefined);

    assert.doesNotThrow(() => on('x', () => undefined));
    scope.release();
});

test('timers stop on release, a fired timeout is inactive, and listen() needs an addEventListener', async () =>
{
    const scope = new FeatureScope();
    let ticks = 0;
    let fired = 0;
    const interval = scope.interval(() => ticks++, 5);
    const timeout = scope.timeout(() => fired++, 5);
    const calls: string[] = [];
    const target = {
        addEventListener: (type: string): void => { calls.push(`add ${type}`); },
        removeEventListener: (type: string): void => { calls.push(`remove ${type}`); }
    };

    scope.listen(target, 'keydown', () => undefined);
    scope.listen({}, 'keydown', () => undefined);

    // A loaded machine runs timers late: wait for the ticks rather than a fixed time, and release
    // whatever happens, or a live interval keeps the test process from ever ending.
    try
    {
        for(const deadline = Date.now() + 2000; (ticks < 2 || fired < 1) && Date.now() < deadline;) await new Promise(resolve => setTimeout(resolve, 5));

        assert.ok(ticks >= 2);
        assert.equal(fired, 1);
        assert.equal(timeout.active, false);
        assert.equal(interval.active, true);
    }
    finally
    {
        scope.release();
    }

    const after = ticks;

    await new Promise(resolve => setTimeout(resolve, 20));

    assert.equal(ticks, after, 'the interval stopped');
    assert.equal(interval.active, false);
    assert.deepEqual(calls, ['add keydown', 'remove keydown']);
});

test('own() disposes, hook() publishes under __ambreia and withdraws, a failing release does not stop the rest', () =>
{
    const scope = new FeatureScope();
    const session = {disposed: false, dispose(): void { this.disposed = true; }};
    const hook = {session};

    delete root.__ambreia;
    scope.own(session).hook('probe', hook);
    scope.add(() => { throw new Error('a release that fails'); });

    assert.equal(root.__ambreia?.probe, hook);

    scope.release();

    assert.equal(session.disposed, true);
    assert.equal(root.__ambreia?.probe, undefined);
});

test('adding to a released scope releases at once', () =>
{
    const scope = new FeatureScope();
    let released = 0;

    scope.release();
    scope.add(() => released++);

    assert.equal(released, 1);
});
