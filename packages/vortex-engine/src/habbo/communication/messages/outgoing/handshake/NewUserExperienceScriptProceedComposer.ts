import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Signal progression through the new user experience (NUX) tutorial.
 *
 * Sends an empty array - just a confirmation signal with no data payload.
 *
 * @see sources/win63_version/habbo/communication/messages/outgoing/nux/NewUserExperienceScriptProceedComposer.as
 */
export class NewUserExperienceScriptProceedComposer extends MessageComposer<[]>
{
    private _data: [] = [];

    constructor()
    {
        super();
    }

    // AS3: sources/win63_version/habbo/communication/messages/outgoing/nux/NewUserExperienceScriptProceedComposer.as::getMessageArray()
    getMessageArray(): []
    {
        return this._data;
    }
}
