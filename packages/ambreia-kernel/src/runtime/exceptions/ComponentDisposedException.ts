import {Exception} from './Exception';

/**
 * Thrown when attempting to use a disposed component.
 *
 * @see sources/win63_version/core/runtime/exceptions/ComponentDisposedException.as
 */
export class ComponentDisposedException extends Exception
{
    constructor(message: string)
    {
        super(message);
    }
}
