import {test} from 'node:test';
import assert from 'node:assert/strict';
import {findLeaks} from './check-release-bundle.mjs';

test('a message name in a script of the bundle is a leak', () =>
{
    assert.deepEqual(
        findLeaks([{name: 'index.js', text: 'x.set(1873,a);"SSOTicketMessageEvent"'}, {name: 'other.js', text: 'y(412)'}], ['SSOTicketMessageEvent', 'PingMessageComposer']),
        [{file: 'index.js', name: 'SSOTicketMessageEvent'}]
    );
});

test('a source map is a leak whatever it holds', () =>
{
    assert.deepEqual(findLeaks([{name: 'index.js.map', text: '{}'}], []), [{file: 'index.js.map', name: '(source map)'}]);
});

test('a name inside a longer identifier is not a leak', () =>
{
    assert.deepEqual(findLeaks([{name: 'a.js', text: 'MySSOTicketMessageEventX'}], ['SSOTicketMessageEvent']), []);
});
