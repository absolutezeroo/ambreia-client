import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Ask for the achievements a resolution furni can be set to — header 1760 in WIN63's registry
 * (`_SafeCls_2046.as::_composers[1760]`).
 *
 * **The second field does double duty.** Sent as 0 it means "just give me the list"; sent with an
 * achievement id it *commits* that choice, which is what the resolution window's save button does.
 * Same header, same shape, two meanings — so the default matters.
 *
 * `AchievementsResolutionController` sends the 0 form on every event that could have moved the
 * player's progress (a level-up or a completed achievement matching the one on screen), which is how
 * the progress view refreshes without a message of its own.
 *
 * Name RECOVERED from
 * sources/win63_version/habbo/communication/messages/outgoing/game/lobby/GetResolutionAchievementsMessageComposer.as
 * — that tree is obfuscated too, but it is the one where messages keep readable filenames.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2563/_SafeCls_2562.as
 */
export class GetResolutionAchievementsMessageComposer extends MessageComposer<[number, number]>
{
    // AS3: _SafeCls_2562.as::_data (name derived: the field is _SafeStr_4556 in every tree)
    private _data: [number, number];

    // AS3: _SafeCls_2562.as::_SafeCls_2562()
    constructor(stuffId: number, achievementId: number = 0)
    {
        super();

        this._data = [stuffId, achievementId];
    }

    // AS3: _SafeCls_2562.as::getMessageArray()
    getMessageArray(): [number, number]
    {
        return this._data;
    }
}
