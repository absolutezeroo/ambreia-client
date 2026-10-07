/**
 * Container for additional effect data in animations.
 *
 * @see sources/win63_version/habbo/avatar/animation/AddDataContainer.as
 */
export class AddDataContainer
{
    constructor(data: any)
    {
        this._id = String(data.id || '');
        this._align = String(data.align || '');
        this._base = String(data.base || '');
        this._ink = String(data.ink || '');

        const blendStr = String(data.blend || '');

        if(blendStr.length > 0)
        {
            this._blend = Number(blendStr);

            if(this._blend > 1)
            {
                this._blend /= 100;
            }
        }
    }

    private _id: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/AddDataContainer.as::get id()
    public get id(): string
    {
        return this._id;
    }

    private _align: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/AddDataContainer.as::get align()
    public get align(): string
    {
        return this._align;
    }

    private _base: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/AddDataContainer.as::get base()
    public get base(): string
    {
        return this._base;
    }

    private _ink: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/AddDataContainer.as::get ink()
    public get ink(): string
    {
        return this._ink;
    }

    private _blend: number = 1;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/AddDataContainer.as::get blend()
    public get blend(): number
    {
        return this._blend;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/AddDataContainer.as::get isBlended()
    public get isBlended(): boolean
    {
        return this._blend !== 1;
    }
}
