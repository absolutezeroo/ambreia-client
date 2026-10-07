import type {IWidget} from './IWidget';
import type {ChatBubbleMessage} from './ChatBubbleMessage';

/**
 * Interface for the Illumina chat bubble widget.
 *
 * Renders a chat bubble with avatar, username, messages, timestamp,
 * and online status indicator. Supports flipped layout and message
 * confirmation tracking.
 *
 * @see sources/win63_version/habbo/window/widgets/IIlluminaChatBubbleWidget.as
 */
export interface IIlluminaChatBubbleWidget extends IWidget
{
    /**
	 * Whether the bubble layout is flipped (avatar on right).
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IIlluminaChatBubbleWidget.as::get flipped()
    flipped: boolean;

    /**
	 * The display name of the user.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IIlluminaChatBubbleWidget.as::get userName()
    userName: string;

    /**
	 * The user ID for click-to-profile behavior.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IIlluminaChatBubbleWidget.as::get userId()
    userId: number;

    /**
	 * The avatar figure string.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IIlluminaChatBubbleWidget.as::get figure()
    figure: string;

    /**
	 * The number of messages in the bubble.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IIlluminaChatBubbleWidget.as::get numMessages()
    readonly numMessages: number;
    /**
	 * The timestamp of the message (milliseconds since epoch).
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IIlluminaChatBubbleWidget.as::get timeStamp()
    timeStamp: number;

    /**
	 * Get a message by index.
	 *
	 * @param index - The message index
	 * @returns The message text
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IIlluminaChatBubbleWidget.as::getMessage()
    getMessage(index: number): ChatBubbleMessage | null;

    /**
	 * Set a message at the given index.
	 *
	 * @param index - The message index
	 * @param text - The message text
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IIlluminaChatBubbleWidget.as::setMessage()
    setMessage(index: number, message: ChatBubbleMessage | string): void;

    /**
	 * Append a message to the bubble.
	 *
	 * @param text - The message text
	 * @param prepend - Whether to insert at the beginning
	 * @param confirmationId - Optional awaiting confirmation ID
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IIlluminaChatBubbleWidget.as::appendMessage()
    appendMessage(message: ChatBubbleMessage | string, prepend?: boolean, confirmationId?: number): void;

    /**
	 * Set the friend online status indicator.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IIlluminaChatBubbleWidget.as::set friendOnlineStatus()
    set friendOnlineStatus(value: boolean);

    /**
	 * Set an awaiting confirmation ID on a message.
	 *
	 * @param messageIndex - The message index
	 * @param confirmationId - The confirmation ID
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IIlluminaChatBubbleWidget.as::setAwaitingConfirmationId()
    setAwaitingConfirmationId(messageIndex: number, confirmationId: number): void;

    /**
	 * Clear an awaiting confirmation ID on a message.
	 *
	 * @param messageIndex - The message index
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IIlluminaChatBubbleWidget.as::clearAwaitingConfirmationId()
    clearAwaitingConfirmationId(messageIndex: number): void;

    /**
	 * Get the awaiting confirmation ID for a message.
	 *
	 * @param messageIndex - The message index
	 * @returns The confirmation ID, or 0
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IIlluminaChatBubbleWidget.as::getAwaitingConfirmationId()
    getAwaitingConfirmationId(messageIndex: number): number;
}
