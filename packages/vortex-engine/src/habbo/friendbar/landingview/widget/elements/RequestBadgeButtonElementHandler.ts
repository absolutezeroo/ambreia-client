import type {IWindow} from '@core/window/IWindow';
import type {HabboLandingView} from '../../HabboLandingView';
import type {GenericWidget} from '../GenericWidget';
import type {IFloatableElementHandler} from '../../interfaces/elements/IFloatableElementHandler';
import {ButtonElementHandler} from './ButtonElementHandler';
import {GetIsBadgeRequestFulfilledComposer} from '@habbo/communication/messages/outgoing/inventory/GetIsBadgeRequestFulfilledComposer';
import {IsBadgeRequestFulfilledEvent} from '@habbo/communication/messages/incoming/inventory/badges/IsBadgeRequestFulfilledEvent';
import type {IsBadgeRequestFulfilledEventParser} from '@habbo/communication/messages/parser/inventory/badges/IsBadgeRequestFulfilledEventParser';
import type {IMessageEvent} from '@core/communication/messages/IMessageEvent';

/**
 * Button that requests a badge, hiding itself once the badge has been fulfilled.
 * (AS3 also re-checks on any wired reward event; the RPG fork removed wired.)
 *
 * AS3 identifier recovered from sources/win63_version/habbo/friendbar/landingview/widget/elements/class_4144.as
 * (obfuscated as `_SafeCls_4537` in the primary source; the 5 `requestbadgebutton*`
 * config type strings in `ElementHandlerFactory` all resolve to this one class).
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/friendbar/landingview/widget/elements/_SafeCls_4537.as
 */
export class RequestBadgeButtonElementHandler extends ButtonElementHandler implements IFloatableElementHandler
{
    // AS3: .../src/com/sulake/habbo/friendbar/landingview/widget/elements/_SafeCls_4537.as::_badgeRequestCode
    private _badgeRequestCode: string = '';
    private _isFloating: boolean = true;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/friendbar/landingview/widget/elements/_SafeCls_4537.as::initialize()
    override initialize(landingView: HabboLandingView, window: IWindow, params: string[], ownerWidget: GenericWidget): void
    {
        super.initialize(landingView, window, params, ownerWidget);

        this._badgeRequestCode = params[2];
        window.x = parseInt(params[3], 10);
        window.y = parseInt(params[4], 10);

        if(params.length > 5)
        {
            this._isFloating = params[5] === 'true';
        }

        // AS3 also re-checks on every wired reward result (`onReward`); the RPG fork removed wired.
        landingView.communicationManager?.addHabboConnectionMessageEvent(new IsBadgeRequestFulfilledEvent(this.onInfo));
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/friendbar/landingview/widget/elements/_SafeCls_4537.as::onClick()
    protected override onClick(): void
    {
        this.landingView?.requestBadge(this._badgeRequestCode);
        this.landingView?.tracking?.trackGoogle('landingView', 'click_requestbadge_' + this._badgeRequestCode);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/friendbar/landingview/widget/elements/_SafeCls_4537.as::refresh()
    override refresh(): void
    {
        super.refresh();
        this.landingView?.send(new GetIsBadgeRequestFulfilledComposer(this._badgeRequestCode));
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/friendbar/landingview/widget/elements/_SafeCls_4537.as::isFloating()
    isFloating(_value: boolean): boolean
    {
        return this._isFloating;
    }

    private onInfo = (event: IMessageEvent): void =>
    {
        const parser = event.parser as IsBadgeRequestFulfilledEventParser | null;

        if(!parser) return;
        if(parser.requestCode !== this._badgeRequestCode) return;
        if(!this.window) return;

        this.window.visible = !parser.fulfilled;
    };
}
