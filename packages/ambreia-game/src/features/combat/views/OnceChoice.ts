import type {DeathChoice} from '@ambreia/protocol/outgoing/rpg/combat/RpgDeathChoiceMessage';

/**
 * The KO player's choices, each sent once whatever the clicks (spec §7 review focus): release or
 * accept stands him up, after which nothing more goes; a new offer can be answered again.
 */
export class OnceChoice
{
    private readonly _sent = new Set<DeathChoice>();

    constructor(private readonly _send: (choice: DeathChoice) => void) {}

    choose(choice: DeathChoice): void
    {
        if(this._sent.has(choice) || this._sent.has('release') || this._sent.has('accept')) return;

        this._sent.add(choice);
        this._send(choice);
    }

    /** A new offer arrived: accept and decline are open again. */
    newOffer(): void
    {
        this._sent.delete('accept');
        this._sent.delete('decline');
    }

    /** A new KO. */
    reset(): void
    {
        this._sent.clear();
    }
}
