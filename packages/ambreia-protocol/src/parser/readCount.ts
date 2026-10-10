import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * A list's count, bounded by what is left to read. A count the frame cannot hold (a negative one,
 * or 2^31 in a 1 MiB frame) used to drive a loop or an `Array.from({length})` until the first read
 * past the end, or until the allocation failed; the frame is at most 1 MiB and every item takes at
 * least `minBytesPerItem`, so anything larger is refused before a single item is read.
 */
export function readCount(wrapper: IMessageDataWrapper, minBytesPerItem = 1): number
{
    const count = wrapper.readInt();
    const available = wrapper.bytesAvailable;

    if(count < 0 || (Number.isFinite(available) && count * minBytesPerItem > available))
    {
        throw new RangeError(`A count of ${count} items does not fit in the ${Number.isFinite(available) ? available : '?'} bytes left of the message`);
    }

    return count;
}
