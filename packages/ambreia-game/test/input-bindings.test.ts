// UI-01: one keyboard for the features. A key two features bind is an error naming both, nothing
// fires from a text field or with a modifier held, digits read by their row, Escape is a stack.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {InputBindings, chordOf} from '../src/features/input/InputBindings';

const key = (key: string, extra: Partial<KeyboardEvent> & {code?: string} = {}): KeyboardEvent =>
    ({key, code: extra.code ?? '', ctrlKey: false, altKey: false, metaKey: false, target: null, ...extra} as unknown as KeyboardEvent);

test('a chord is the digit of the row, the letter without case, else the key name', () =>
{
    assert.equal(chordOf({key: '&', code: 'Digit1'}), '1');
    assert.equal(chordOf({key: '3', code: 'Numpad3'}), '3');
    assert.equal(chordOf({key: 'K', code: 'KeyK'}), 'k');
    assert.equal(chordOf({key: 'Escape', code: 'Escape'}), 'Escape');
});

test('a key bound by two features is an error naming both; unbinding frees it', () =>
{
    const input = new InputBindings();
    const unbind = input.bind('inventory', 'i', () => undefined);

    assert.throws(() => input.bind('skills', 'I', () => undefined), /Key "I" is bound by both "inventory" and "skills"/);
    assert.throws(() => input.bind('skills', 'Escape', () => undefined), /binds Escape: it is a stack/);

    unbind();
    input.bind('skills', 'i', () => undefined);
    assert.deepEqual(input.describe(), [{chord: 'i', owner: 'skills'}]);
});

test('a binding fires on its key, not from a text field, not with a modifier, not when its gate says no', () =>
{
    const input = new InputBindings();
    let opened = 0;
    let inWorld = true;

    input.bind('inventory', 'i', () => opened++, {when: () => inWorld});

    assert.equal(input.dispatch(key('i')), true);
    assert.equal(input.dispatch(key('I')), true);
    assert.equal(input.dispatch(key('i', {target: {tagName: 'INPUT'} as unknown as EventTarget})), false);
    assert.equal(input.dispatch(key('i', {ctrlKey: true})), false);
    inWorld = false;
    assert.equal(input.dispatch(key('i')), false);
    assert.equal(opened, 2);
});

test('Escape goes to the last pushed handler first, and on to the next while none consumes it', () =>
{
    const input = new InputBindings();
    const order: string[] = [];
    let picking = true;

    input.onEscape('interaction', () => { order.push('target'); return true; });
    const unpush = input.onEscape('skills', () => { order.push('pick'); if(!picking) return false; picking = false; return true; });

    assert.equal(input.dispatch(key('Escape')), true);
    assert.deepEqual(order, ['pick']);
    assert.equal(input.dispatch(key('Escape')), true);
    assert.deepEqual(order, ['pick', 'pick', 'target']);

    unpush();
    input.dispatch(key('Escape'));
    assert.deepEqual(order, ['pick', 'pick', 'target', 'target']);

    input.clear();
    assert.equal(input.dispatch(key('Escape')), false);
});
