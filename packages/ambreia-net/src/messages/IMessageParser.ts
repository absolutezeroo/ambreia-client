import type {IMessageDataWrapper} from './IMessageDataWrapper';

/**
 * Interface for incoming message parsers
 * Each parser knows how to extract data from a specific message type
 */
export interface IMessageParser
{
    /**
	 * Reset parser state for reuse
	 */
    // AS3: .../src/com/sulake/core/communication/messages/IMessageParser.as::flush()
    flush(): boolean;

    /**
	 * Parse the message data
	 * @param wrapper The message data to parse
	 * @returns True if parsing succeeded
	 */
    // AS3: .../src/com/sulake/core/communication/messages/IMessageParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean;
}
