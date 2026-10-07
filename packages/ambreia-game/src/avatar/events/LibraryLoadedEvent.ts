/**
 * Event dispatched when an avatar asset library has finished loading.
 *
 * @see sources/win63_version/habbo/avatar/events/LibraryLoadedEvent.as
 */
export class LibraryLoadedEvent
{
    constructor(type: string, library: string)
    {
        this._type = type;
        this._library = library;
    }

    private _type: string;

    public get type(): string
    {
        return this._type;
    }

    private _library: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/events/LibraryLoadedEvent.as::get library()
    public get library(): string
    {
        return this._library;
    }
}
