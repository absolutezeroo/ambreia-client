/**
 * The forums' own string builder, used to assemble the HTML a message row renders.
 *
 * It accumulates **char codes**, not strings, which is what makes `addEscaped()` cheap: the two
 * characters that would open a tag are the only ones it has to branch on, and everything else goes
 * through as a number. `toString()` reassembles them in one call.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/friendbar/groupforums/StringBuffer.as
 */
export class StringBuffer
{
    // AS3: .../src/com/sulake/habbo/friendbar/groupforums/StringBuffer.as::GT_CHAR
    private static readonly GT_CHAR: number = '>'.charCodeAt(0);

    // AS3: .../src/com/sulake/habbo/friendbar/groupforums/StringBuffer.as::LT_CHAR
    private static readonly LT_CHAR: number = '<'.charCodeAt(0);

    // AS3: .../src/com/sulake/habbo/friendbar/groupforums/StringBuffer.as::buffer
    // AS3 spells it `buffer`, without the underscore every other private field in the module has;
    // renamed here to the port's own private-field convention (enforced by ESLint naming-convention).
    private _buffer: number[] = [];

    // AS3: .../src/com/sulake/habbo/friendbar/groupforums/StringBuffer.as::addEscaped()
    addEscaped(text: string): StringBuffer
    {
        for(let i = 0; i < text.length; i++)
        {
            const code = text.charCodeAt(i);

            switch(code)
            {
                case StringBuffer.LT_CHAR:
                    this.add('&lt;');
                    break;
                case StringBuffer.GT_CHAR:
                    this.add('&gt;');
                    break;
                default:
                    this._buffer.push(code);
            }
        }

        return this;
    }

    // AS3: .../src/com/sulake/habbo/friendbar/groupforums/StringBuffer.as::add()
    add(text: string): StringBuffer
    {
        for(let i = 0; i < text.length; i++)
        {
            this._buffer.push(text.charCodeAt(i));
        }

        return this;
    }

    // AS3: .../src/com/sulake/habbo/friendbar/groupforums/StringBuffer.as::toString()
    // AS3 spreads the whole buffer through `String.fromCharCode.apply`. The chunking here is not a
    // behaviour change: `fromCharCode` takes its codes as arguments, and a long enough post would
    // overflow the argument stack, which AS3's `apply` did not have to worry about.
    toString(): string
    {
        let result = '';

        for(let i = 0; i < this._buffer.length; i += 8192)
        {
            result += String.fromCharCode(...this._buffer.slice(i, i + 8192));
        }

        return result;
    }

    // AS3: .../src/com/sulake/habbo/friendbar/groupforums/StringBuffer.as::get length()
    get length(): number
    {
        return this._buffer.length;
    }

    // AS3: .../src/com/sulake/habbo/friendbar/groupforums/StringBuffer.as::reset()
    reset(): void
    {
        this._buffer = [];
    }
}
