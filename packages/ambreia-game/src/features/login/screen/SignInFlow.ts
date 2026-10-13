import {Logger} from '@ambreia/common/utils/Logger';
import {AuthApiError} from '../AuthApi';

const log = Logger.getLogger('habbo.features.login.SignInFlow');

/** One sign-in (a login or a registration) at a time; on success, the account ticket the socket logs in with. */
export class SignInFlow
{
    private _busy = false;

    /**
     * @param ticket - the account ticket, once signed in (AuthApi.accountTicket())
     * @param onDone - signed in: the ticket
     * @param onError - refused: the server's code, `unknown` for anything else
     * @param onBusy - a request starts (true) or ends (false): the form waits meanwhile
     */
    constructor(
        private readonly _ticket: () => Promise<string>,
        private readonly _onDone: (ticket: string) => void,
        private readonly _onError: (code: string) => void,
        private readonly _onBusy: (busy: boolean) => void = () => {}
    ) {}

    get busy(): boolean
    {
        return this._busy;
    }

    async run(signIn: () => Promise<void>): Promise<void>
    {
        if(this._busy) return;

        this._busy = true;
        this._onBusy(true);

        try
        {
            await signIn();
            this._onDone(await this._ticket());
        }
        catch (error)
        {
            const code = error instanceof AuthApiError ? error.code : 'unknown';

            log.info(`sign in refused: ${code}`);
            this._onError(code);
        }
        finally
        {
            this._busy = false;
            this._onBusy(false);
        }
    }
}
