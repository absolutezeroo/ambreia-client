/**
 * Library loading progress event data class.
 *
 * Carries progress information for library/asset loading.
 *
 * @see sources/win63_version/core/runtime/events/LibraryProgressEvent.as
 */
export class LibraryProgressEvent
{
    constructor(fileName: string, bytesLoaded: number = 0, bytesTotal: number = 0, elapsedTime: number = 0)
    {
        this._fileName = fileName;
        this._bytesLoaded = bytesLoaded;
        this._bytesTotal = bytesTotal;
        this._elapsedTime = elapsedTime;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/events/LibraryProgressEvent.as::_fileName
    private _fileName: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/events/LibraryProgressEvent.as::get fileName()
    get fileName(): string
    {
        return this._fileName;
    }

    private _bytesLoaded: number;

    get bytesLoaded(): number
    {
        return this._bytesLoaded;
    }

    private _bytesTotal: number;

    get bytesTotal(): number
    {
        return this._bytesTotal;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/events/LibraryProgressEvent.as::_elapsedTime
    private _elapsedTime: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/events/LibraryProgressEvent.as::get elapsedTime()
    get elapsedTime(): number
    {
        return this._elapsedTime;
    }

    /**
	 * Loading progress as a value between 0 and 1
	 */
    get progress(): number
    {
        return this._bytesTotal > 0 ? this._bytesLoaded / this._bytesTotal : 0;
    }
}
