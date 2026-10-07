/**
 * IRoomWidgetMessageListener
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/IRoomWidgetMessageListener.as
 *
 * Listener interface for processing widget messages.
 */
export interface IRoomWidgetMessageListener
{
    /**
	 * Processes a widget message and returns an update event, or null.
	 */
    // AS3: .../src/com/sulake/habbo/ui/widget/IRoomWidgetMessageListener.as::processWidgetMessage()
    processWidgetMessage(message: unknown): unknown;
}
