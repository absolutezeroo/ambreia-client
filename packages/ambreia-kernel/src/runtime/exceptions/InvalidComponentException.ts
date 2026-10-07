import {Exception} from './Exception';

/**
 * Thrown when a component is invalid (e.g., bad class, missing manifest).
 *
 * @see sources/win63_version/core/runtime/exceptions/InvalidComponentException.as
 */
export class InvalidComponentException extends Exception
{
    constructor(message: string)
    {
        super(message);
    }
}
