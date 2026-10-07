import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * Parser for guide session started messages.
 * Contains information about both the requester and guide in a new session.
 *
 * @see source_as_win63/habbo/communication/messages/parser/help/GuideSessionStartedMessageEventParser.as
 */
export class GuideSessionStartedMessageParser implements IMessageParser
{
    private _requesterUserId: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/help/GuideSessionStartedMessageEventParser.as::get requesterUserId()
    get requesterUserId(): number
    {
        return this._requesterUserId;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/help/GuideSessionStartedMessageEventParser.as::_requesterName
    private _requesterName: string = '';

    // AS3: sources/win63_version/habbo/communication/messages/parser/help/GuideSessionStartedMessageEventParser.as::get requesterName()
    get requesterName(): string
    {
        return this._requesterName;
    }

    private _requesterFigure: string = '';

    // AS3: sources/win63_version/habbo/communication/messages/parser/help/GuideSessionStartedMessageEventParser.as::get requesterFigure()
    get requesterFigure(): string
    {
        return this._requesterFigure;
    }

    private _guideUserId: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/help/GuideSessionStartedMessageEventParser.as::get guideUserId()
    get guideUserId(): number
    {
        return this._guideUserId;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/help/GuideSessionStartedMessageEventParser.as::_guideName
    private _guideName: string = '';

    // AS3: sources/win63_version/habbo/communication/messages/parser/help/GuideSessionStartedMessageEventParser.as::get guideName()
    get guideName(): string
    {
        return this._guideName;
    }

    private _guideFigure: string = '';

    // AS3: sources/win63_version/habbo/communication/messages/parser/help/GuideSessionStartedMessageEventParser.as::get guideFigure()
    get guideFigure(): string
    {
        return this._guideFigure;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/help/GuideSessionStartedMessageEventParser.as::flush()
    flush(): boolean
    {
        this._requesterUserId = 0;
        this._requesterName = '';
        this._requesterFigure = '';
        this._guideUserId = 0;
        this._guideName = '';
        this._guideFigure = '';
        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/help/GuideSessionStartedMessageEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._requesterUserId = wrapper.readInt();
        this._requesterName = wrapper.readString();
        this._requesterFigure = wrapper.readString();
        this._guideUserId = wrapper.readInt();
        this._guideName = wrapper.readString();
        this._guideFigure = wrapper.readString();

        return true;
    }
}
