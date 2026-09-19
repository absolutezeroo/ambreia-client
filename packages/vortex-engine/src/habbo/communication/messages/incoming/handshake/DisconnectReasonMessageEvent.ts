import {MessageEvent} from '@core/communication/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@core/communication/messages/IMessageEvent';
import {DisconnectReasonMessageParser} from '../../parser/handshake/DisconnectReasonMessageParser';

/**
 * Event handler for Disconnect reason message
 * Message ID: 4000
 *
 * @see source_as_win63/habbo/communication/messages/incoming/handshake/DisconnectReasonEvent.as
 */
export class DisconnectReasonMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, DisconnectReasonMessageParser);
    }

    /**
     * Maps a disconnect reason code to the localization key describing it.
     *
     * The AS3 class is `_SafeCls_1707`, identified as this event by its parser
     * (`_SafeCls_3893`, the one exposing `reason`) — it declares the whole reason-code table
     * plus this resolver.
     *
     * The reason-code constants and `getReasonName()` stay out. `getReasonName()` builds its table
     * by `describeType()`-ing the class and reading back every `public static const` — Flash
     * reflection with no TypeScript counterpart — and its one AS3 caller passes the result to
     * `IHabboCommunicationDemo.disconnected()`, which this port already feeds from the parser's own
     * `reasonText`. That leaves the constants with no reader at all, and only three of the forty-odd
     * survive the obfuscator with a name — `SOCKET_WRITE_EXCEPTION_1` (117),
     * `SOCKET_WRITE_EXCEPTION_2` (118) and `SOCKET_WRITE_EXCEPTION_3` (119). Every other one is a
     * `_SafeStr_N`, so porting the table would mean inventing names for the rest.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_1708/_SafeCls_1707.as::resolveDisconnectedReasonLocalizationKey()
    static resolveDisconnectedReasonLocalizationKey(reason: number): string
    {
        switch(reason)
        {
            case -2:
                return '${disconnected.maintenance}';
            case 0:
                return '${disconnected.logged_out}';
            case 1:
                return '${disconnected.just_banned}';
            case 10:
                return '${disconnected.still_banned}';
            case 2:
            case 13:
            case 11:
            case 18:
                return '${disconnected.concurrent_login}';
            case 12:
            case 19:
                return '${disconnected.hotel_closed}';
            case 20:
                return '${disconnected.incorrect_password}';
            case 112:
                return '${disconnected.idle}';
            case 122:
                return '${disconnected.incompatible_client_version}';
            // AS3 spells out 39 more cases (4, 5, 16-17, 22-29, 100-126) before its own default,
            // and every one of them returns this same key. Collapsing them changes nothing.
            default:
                return '${disconnected.generic}';
        }
    }

    /**
     * The coarse reason bucket the web logout URL carries, as `&reason=<this>`.
     *
     * Four buckets where the resolver above has eleven — that is AS3's own switch, not a
     * simplification: the CMS only distinguishes a ban from a double login from a bad password.
     *
     * DEVIATION: nothing calls it, here or in AS3 — and the second half is the point. Its only AS3
     *   consumer is `_SafeCls_1951.handleWebLogout()`, which builds the `logout.url` redirect out of
     *   it, and `grep -n "handleWebLogout(" habbo/communication/demo/_SafeCls_1951.as` finds exactly
     *   one line: the declaration. The redirect is unreachable in the shipped client, so the port
     *   carries the value and not the dead caller. Written out rather than omitted because the
     *   caller is four lines away from being live if a hotel ever wires it: read `logout.url`,
     *   substitute this string and `&id=<reason>`, then `HabboWebTools.sendDisconnectToWeb()` when
     *   `spaweb == 1` (the live branch under `vortex-web`) or `openWebPage(url, '_self')`.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_1708/_SafeCls_1707.as::get reasonString()
    static reasonString(reason: number): string
    {
        switch(reason)
        {
            case 1:
            case 10:
                return 'banned';
            case 2:
                return 'concurrentlogin';
            case 20:
                return 'incorrectpassword';
            default:
                return 'logout';
        }
    }
}
