/**
 * What a furni's state data reads from: the two calls the stuff data parsers make. The network's
 * message wrapper (`@ambreia/net`) has them, so the engine passes it as is; iso does not depend on
 * the network (spec §3).
 */
export interface IStuffDataReader
{
    readInt(): number;
    readString(): string;
}
