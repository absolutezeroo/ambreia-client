/** What the registration form holds when it is sent. */
export interface IRegisterForm
{
    email: string;
    password: string;
    confirm: string;
    acceptTerms: boolean;
    acceptPrivacy: boolean;
}
