/**
 * A bounded pool of integer ids that can be handed out and given back.
 *
 * Constructed with a size, it holds `0 .. size - 1` and lends them one at a time.
 * `reserveNumber()` answers -1 once every id is out on loan, which is a real signal and not an
 * error code to ignore: `RoomEngine.getGenericRoomObjectThumbnail()` gives up and returns no
 * image on it, so a caller that leaks ids degrades into "no thumbnails" rather than growing a
 * counter forever.
 *
 * Ids come back from the *end* of the free list, so the sequence is descending and a freed id is
 * the next one lent. That is AS3's `pop()`, kept because a caller comparing ids across a
 * reserve/free cycle sees the same order it always did.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/NumberBank.as
 */
export class NumberBank
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/NumberBank.as::_reservedNumbers
    private _reservedNumbers: number[] | null = [];

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/NumberBank.as::_freeNumbers
    private _freeNumbers: number[] | null = [];

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/NumberBank.as::NumberBank()
    constructor(size: number)
    {
        const total = (size < 0) ? 0 : size;

        for(let i = 0; i < total; i++)
        {
            this._freeNumbers!.push(i);
        }
    }

    /**
	 * Lends the next free id, or -1 when there is none left.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/NumberBank.as::reserveNumber()
    public reserveNumber(): number
    {
        if(this._freeNumbers === null || this._freeNumbers.length === 0) return -1;

        const value = this._freeNumbers.pop()!;

        this._reservedNumbers!.push(value);

        return value;
    }

    /**
	 * Returns an id to the pool.
	 *
	 * Silently ignores an id that was not lent out — freeing twice does not grow the pool past
	 * its size, which is what keeps the bound meaningful.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/NumberBank.as::freeNumber()
    public freeNumber(value: number): void
    {
        if(this._reservedNumbers === null) return;

        const index = this._reservedNumbers.indexOf(value);

        if(index < 0) return;

        this._reservedNumbers.splice(index, 1);
        this._freeNumbers!.push(value);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/NumberBank.as::dispose()
    public dispose(): void
    {
        this._reservedNumbers = null;
        this._freeNumbers = null;
    }
}
