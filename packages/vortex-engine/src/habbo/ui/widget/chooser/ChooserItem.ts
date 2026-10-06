/**
 * One row of a chooser: a room object reduced to what the list needs.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/chooser/ChooserItem.as
 */
export class ChooserItem
{
    // AS3: .../widget/chooser/ChooserItem.as::_id
    private _id: number;

    // AS3: .../widget/chooser/ChooserItem.as::_category
    private _category: number;

    // AS3: .../widget/chooser/ChooserItem.as::_name
    private _name: string;

    // AS3: .../widget/chooser/ChooserItem.as::_owner
    private _owner: string | null;

    // AS3: .../widget/chooser/ChooserItem.as::_type
    private _type: number;

    // AS3: .../widget/chooser/ChooserItem.as::_lowerCaseName
    // Precomputed because the search filter runs it against every item on every keystroke.
    private _lowerCaseName: string;

    // AS3: .../widget/chooser/ChooserItem.as::ChooserItem()
    constructor(id: number, category: number, name: string, owner: string | null = null, type: number = 0)
    {
        this._id = id;
        this._category = category;
        this._name = name;
        this._owner = owner;
        this._type = type;
        this._lowerCaseName = name.toLowerCase();
    }

    // AS3: .../widget/chooser/ChooserItem.as::get id()
    get id(): number
    {
        return this._id;
    }

    // AS3: .../widget/chooser/ChooserItem.as::get category()
    get category(): number
    {
        return this._category;
    }

    // AS3: .../widget/chooser/ChooserItem.as::get name()
    get name(): string
    {
        return this._name;
    }

    // AS3: .../widget/chooser/ChooserItem.as::get type()
    get type(): number
    {
        return this._type;
    }

    // DEVIATION: AS3 overrides the owner for two id ranges ("Builders Club", "Temp (Wired)"). The RPG
    //   fork removed the Builders Club and wired, so neither range is ever issued.
    // AS3: .../widget/chooser/ChooserItem.as::get owner()
    get owner(): string | null
    {
        return this._owner;
    }

    // AS3: .../widget/chooser/ChooserItem.as::get lowerCaseName()
    get lowerCaseName(): string
    {
        return this._lowerCaseName;
    }
}
