/** The healer offering a resurrection, as the room knows him. */
export interface IOfferCaster
{
    readonly name: string;
    readonly figure: string;
    /** Null when the client does not know it. */
    readonly level: number | null;
}
