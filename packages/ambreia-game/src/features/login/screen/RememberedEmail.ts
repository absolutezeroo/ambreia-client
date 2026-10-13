const REMEMBER_KEY = 'ambreia:login.email';

/** The e-mail « Se souvenir de moi » keeps in the browser; a private window keeps nothing and loses nothing. */
export class RememberedEmail
{
    constructor(private readonly _storage: () => Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> = () => localStorage) {}

    get(): string | null
    {
        try
        {
            return this._storage().getItem(REMEMBER_KEY);
        }
        catch
        {
            return null;
        }
    }

    /** Remembers `email`, or forgets it (null). */
    set(email: string | null): void
    {
        try
        {
            if(email) this._storage().setItem(REMEMBER_KEY, email);
            else this._storage().removeItem(REMEMBER_KEY);
        }
        catch
        {
            // Private window: nothing remembered, nothing lost.
        }
    }
}
