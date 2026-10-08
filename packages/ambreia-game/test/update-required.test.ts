// Release revisions (spec 2026-10-08-random-header-revisions §4.5): a client the server no longer
// speaks to is told so with reason 122, offers the update, and leaves what "update" means to its
// embedder (App.ts): the engine never navigates the page itself.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {HabboCommunicationDemo} from '../src/communication/demo/HabboCommunicationDemo';
import {HabboCommunicationManagerEvent} from '../src/communication/enum/HabboCommunicationManagerEvent';
import {DisconnectReasonMessageEvent} from '@ambreia/protocol/incoming/handshake/DisconnectReasonMessageEvent';

type AlertCallback = (dialog: {dispose(): void}) => void;
type Alert = {title: string; message: string; callback: AlertCallback};

// disconnected() reads only its window manager and the manager's event bus here; the DI context the
// constructor needs is not.
function demoWith(alerts: Alert[], emitted: string[], windowManager = true): HabboCommunicationDemo
{
    const demo = Object.create(HabboCommunicationDemo.prototype) as HabboCommunicationDemo;
    const fields = demo as unknown as {_windowManager: unknown; _communication: unknown};

    fields._windowManager = windowManager
        ? {alert: (title: string, message: string, _flags: number, callback: AlertCallback) => alerts.push({title, message, callback})}
        : null;
    fields._communication = {events: {emit: (type: string) => emitted.push(type)}};

    return demo;
}

test('an outdated client is offered the update, and OK hands it to the embedder', () =>
{
    const alerts: Alert[] = [];
    const emitted: string[] = [];

    demoWith(alerts, emitted).disconnected(DisconnectReasonMessageEvent.INCOMPATIBLE_CLIENT_VERSION, 'Incompatible client version');

    assert.deepEqual(alerts.map(({title, message}) => [title, message]), [['${disconnect.updaterequired.title}', '${disconnect.updaterequired.description}']]);
    assert.ok(!emitted.includes(HabboCommunicationManagerEvent.UPDATE_REQUIRED), 'nothing happens before the player answers');

    alerts[0].callback({dispose: () => {}});

    assert.deepEqual(emitted.filter(type => type === HabboCommunicationManagerEvent.UPDATE_REQUIRED), [HabboCommunicationManagerEvent.UPDATE_REQUIRED]);
});

test('with no window manager the update is handed over at once', () =>
{
    const emitted: string[] = [];

    demoWith([], emitted, false).disconnected(DisconnectReasonMessageEvent.INCOMPATIBLE_CLIENT_VERSION, 'Incompatible client version');

    assert.ok(emitted.includes(HabboCommunicationManagerEvent.UPDATE_REQUIRED));
});

test('any other reason keeps the usual disconnect dialog', () =>
{
    const alerts: Alert[] = [];
    const emitted: string[] = [];

    demoWith(alerts, emitted).disconnected(2, 'Concurrent login');

    assert.deepEqual(alerts.map(({title}) => title), ['${disconnected.concurrent_login}']);
    assert.ok(!emitted.includes(HabboCommunicationManagerEvent.UPDATE_REQUIRED));
});
