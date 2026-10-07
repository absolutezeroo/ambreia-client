import type {IConnection} from '@ambreia/net/connection/IConnection';
import type {IRoomHandlerListener} from '../IRoomHandlerListener';
import {BaseHandler} from './BaseHandler';

/**
 * Avatar effects handler
 *
 * Stub/no-op handler. In AS3 this registers no message events
 * and has an empty handler body.
 *
 * @see source_as_win63/habbo/session/handler/AvatarEffectsHandler.as
 */
export class AvatarEffectsHandler extends BaseHandler
{
    constructor(connection: IConnection | null, listener: IRoomHandlerListener)
    {
        super(connection, listener);
    }
}
