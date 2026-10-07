import {test} from 'node:test';
import assert from 'node:assert/strict';
import {RoomManager} from '@ambreia/iso/RoomManager';
import type {IRoomContentLoader} from '@ambreia/iso/IRoomContentLoader';
import type {IRoomManagerListener} from '@ambreia/iso/IRoomManagerListener';

// A plain class since J4: built from its options, started by its host, no Core and no DI context.
const options = {property: (): string => '', flag: (): boolean => false};

function listener(): IRoomManagerListener & { initialized: boolean[] }
{
    const initialized: boolean[] = [];

    return {
        initialized,
        roomManagerInitialized: (success: boolean): void => { initialized.push(success); },
        contentLoaded: (): void => {},
        objectInitialized: (): void => {},
        objectsInitialized: (): void => {}
    } as unknown as IRoomManagerListener & { initialized: boolean[] };
}

const loader = {getPlaceHolderTypes: (): string[] => [], dispose: (): void => {}} as unknown as IRoomContentLoader;

test('a started room manager with nothing to preload reports itself initialized', () =>
{
    const manager = new RoomManager(options);
    const l = listener();

    manager.setContentLoader(loader);
    manager.start();
    manager.initialize(null, l);

    assert.deepEqual(l.initialized, [true]);
    manager.dispose();
});

test('initialize() before start() is held until start(), as initComponent() did', () =>
{
    const manager = new RoomManager(options);
    const l = listener();

    manager.setContentLoader(loader);
    manager.initialize(null, l);
    assert.deepEqual(l.initialized, []);

    manager.start();
    assert.deepEqual(l.initialized, [true]);
    manager.dispose();
});
