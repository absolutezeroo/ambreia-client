/**
 * A fixed-size circular buffer for integer values.
 *
 * Stores a fixed number of integer values in a circular buffer,
 * allowing efficient min/max queries over the stored values.
 *
 * @see source_as_win63/habbo/utils/FixedSizeStack.as
 */
export class FixedSizeStack
{
    private _buffer: number[] = [];
    private _capacity: number;
    // AS3: .../src/com/sulake/habbo/utils/FixedSizeStack.as::_index
    private _index: number = 0;

    /**
	 * Create a new FixedSizeStack with the given capacity.
	 *
	 * @param capacity The maximum number of values to store
	 */
    constructor(capacity: number)
    {
        this._capacity = capacity;
    }

    /**
	 * Reset the stack, clearing all stored values.
	 */
    // AS3: .../src/com/sulake/habbo/utils/FixedSizeStack.as::reset()
    reset(): void
    {
        this._buffer = [];
        this._index = 0;
    }

    /**
	 * Add a value to the stack. If the stack is full,
	 * the oldest value is overwritten (circular).
	 *
	 * @param value The integer value to add
	 */
    // AS3: .../src/com/sulake/habbo/utils/FixedSizeStack.as::addValue()
    addValue(value: number): void
    {
        if(this._buffer.length < this._capacity)
        {
            this._buffer.push(value);
        }
        else
        {
            this._buffer[this._index] = value;
        }

        this._index = (this._index + 1) % this._capacity;
    }

    /**
	 * Get the maximum value in the stack.
	 *
	 * @returns The maximum value, or Number.MIN_SAFE_INTEGER if empty
	 */
    // AS3: .../src/com/sulake/habbo/utils/FixedSizeStack.as::getMax()
    getMax(): number
    {
        let max = -2147483648;

        for(let i = 0; i < this._buffer.length; i++)
        {
            if(this._buffer[i] > max)
            {
                max = this._buffer[i];
            }
        }

        return max;
    }

    /**
	 * Get the minimum value in the stack.
	 *
	 * @returns The minimum value, or Number.MAX_SAFE_INTEGER if empty
	 */
    // AS3: .../src/com/sulake/habbo/utils/FixedSizeStack.as::getMin()
    getMin(): number
    {
        let min = 2147483647;

        for(let i = 0; i < this._buffer.length; i++)
        {
            if(this._buffer[i] < min)
            {
                min = this._buffer[i];
            }
        }

        return min;
    }
}
