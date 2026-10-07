import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Request the daily-task list. Sent once at login.
 *
 * @see sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_1781/_SafeCls_1780.as
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/SessionDataManager.as::initSessionData()
 *
 * Header 4100, from WIN63's registry (`_SafeCls_2046.as::_composers[4100]`). Corroborated by
 * vortex-emulator's `GetDailyTasksEvent = 4100`.
 *
 * `initSessionData()` sends exactly two payload-less composers back to back — this one and
 * `_SafeCls_1848` (3642), already ported as `GetUserNftChatStylesMessageComposer`. They are
 * distinguishable only by header, so the pairing was confirmed against both the registry and
 * the emulator rather than by position.
 *
 * The name comes from vortex-emulator; no unobfuscated tree carries this composer.
 */
export class GetDailyTasksComposer extends MessageComposer<[]>
{
    // AS3: .../src/unknowns/_SafePkg_1781/_SafeCls_1780.as::getMessageArray()
    getMessageArray(): []
    {
        return [];
    }
}
