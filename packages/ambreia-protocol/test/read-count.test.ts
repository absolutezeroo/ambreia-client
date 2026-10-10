// A list count the frame cannot hold is refused before a single item is read (NP-04).
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readCount} from '../src/parser/readCount';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

const wrapper = (count: number, bytesAvailable: number): IMessageDataWrapper =>
    ({readInt: () => count, bytesAvailable}) as unknown as IMessageDataWrapper;

test('a count that fits is returned', () =>
{
    assert.equal(readCount(wrapper(3, 12)), 3);
    assert.equal(readCount(wrapper(0, 0)), 0);
});

test('a negative or oversized count throws before any item is read', () =>
{
    assert.throws(() => readCount(wrapper(-1, 100)), RangeError);
    assert.throws(() => readCount(wrapper(2147483647, 1048576)), /does not fit/);
    assert.throws(() => readCount(wrapper(5, 8), 4), /does not fit/);
});

test('a wrapper that reports no size (test doubles) is not bounded', () =>
{
    assert.equal(readCount({readInt: () => 9} as unknown as IMessageDataWrapper), 9);
});
