// Release revisions (spec 2026-10-08-random-header-revisions §4.5): a client the server no longer
// speaks to is told so with reason 122, and offers to reload into the new bundle.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {HabboCommunicationDemo} from '../src/communication/demo/HabboCommunicationDemo';
import {DisconnectReasonMessageEvent} from '@ambreia/protocol/incoming/handshake/DisconnectReasonMessageEvent';

type AlertCallback = (dialog: {dispose(): void}) => void;

// disconnected() reads only its window manager here; the DI context the constructor needs is not.
function demoWith(alerts: {title: string; message: string; callback: AlertCallback}[]): HabboCommunicationDemo
{
    const demo = Object.create(HabboCommunicationDemo.prototype) as HabboCommunicationDemo;

    (demo as unknown as {_windowManager: unknown})._windowManager = {
        alert: (title: string, message: string, _flags: number, callback: AlertCallback) => alerts.push({title, message, callback})
    };

    return demo;
}

test('an outdated client is offered the update, and OK reloads without the spent ticket', () =>
{
    const alerts: {title: string; message: string; callback: AlertCallback}[] = [];
    const replaced: string[] = [];

    (globalThis as unknown as {window: unknown}).window = {location: {pathname: '/client/', replace: (url: string) => replaced.push(url)}};

    demoWith(alerts).disconnected(DisconnectReasonMessageEvent.INCOMPATIBLE_CLIENT_VERSION, 'Incompatible client version');

    assert.deepEqual(alerts.map(({title, message}) => [title, message]), [['${disconnect.updaterequired.title}', '${disconnect.updaterequired.description}']]);

    alerts[0].callback({dispose: () => {}});

    assert.deepEqual(replaced, ['/client/']);
});

test('any other reason keeps the usual disconnect dialog', () =>
{
    const alerts: {title: string; message: string; callback: AlertCallback}[] = [];

    demoWith(alerts).disconnected(2, 'Concurrent login');

    assert.deepEqual(alerts.map(({title}) => title), ['${disconnected.concurrent_login}']);
});
