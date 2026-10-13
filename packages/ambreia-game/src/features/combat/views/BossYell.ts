import type {WindowBits} from '../../../ui/kit/WindowBits';
import {chatClock, type IChatLine} from '../../../ui/kit/chatModel';

/** A boss's phase (M1c, RpgMonsterYell): its line over it, and in the chat as a system line. */
export class BossYell
{
    constructor(
        private readonly _over: (objectId: number, text: string) => void,
        private readonly _chat: (line: IChatLine) => void,
        private readonly _texts: () => Pick<WindowBits, 'text' | 'textOr'>,
        private readonly _nameOf: (objectId: number) => string | null
    ) {}

    yell(yell: {readonly objectId: number; readonly textKey: string}): void
    {
        const texts = this._texts();
        const line = texts.textOr(yell.textKey, yell.textKey);

        this._over(yell.objectId, line);
        this._chat({
            time: chatClock(Date.now() / 1000), channel: 'system', author: '',
            message: texts.text('vortex.combat.yell', 'monster', this._nameOf(yell.objectId) ?? '', 'text', line)
        });
    }
}
