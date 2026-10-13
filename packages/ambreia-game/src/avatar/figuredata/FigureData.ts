import type {IAvatarImageListener} from '@ambreia/avatar/IAvatarImageListener';
import type {IFigureDataOwner} from './IFigureDataOwner';
import type {IFigureDataView} from './IFigureDataView';
import type {IFigureData} from './IFigureData';
import {FigureDataView} from './FigureDataView';

/**
 * The editable figure: a part type → set id map, a part type → colour ids map, and the string
 * serialisation that joins them.
 *
 * The editor keeps **two** of these, one per gender, and swaps between them — so switching sex in
 * the editor restores whatever you had last built for that sex rather than converting the figure.
 *
 * Only fifteen part types can be written. `savePartSetId()` and `savePartSetColourId()` both switch
 * on the type and silently ignore anything else, `bd` (body) included — the body is not editable.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/figuredata/FigureData.as
 */
export class FigureData implements IFigureData, IAvatarImageListener
{
    // AS3: .../avatar/figuredata/FigureData.as::MALE
    public static readonly MALE: string = 'M';

    // AS3: .../avatar/figuredata/FigureData.as::FEMALE
    // Name DERIVED (`_SafeStr_10435`), from its value.
    public static readonly FEMALE: string = 'F';

    // AS3: .../avatar/figuredata/FigureData.as::UNISEX
    // Name DERIVED (`_SafeStr_10400`), from its value "U" — the gender a part set carries when it
    // suits both. Declared here and read by nobody; the part-set filter compares the literal.
    public static readonly UNISEX: string = 'U';

    // AS3: .../avatar/figuredata/FigureData.as::SCALE
    // Declared and unread here — `FigureDataView` passes the same "h" literal to the renderer.
    public static readonly SCALE: string = 'h';

    // AS3: .../avatar/figuredata/FigureData.as::ACTION
    // Likewise declared and unread.
    public static readonly ACTION: string = 'std';

    // AS3: .../avatar/figuredata/FigureData.as::DEFAULT_FRAME
    public static readonly DEFAULT_FRAME: string = '0';

    // AS3: .../avatar/figuredata/FigureData.as::DEFAULT_DIRECTION
    // Name DERIVED: the 4 AS3 assigns to `_direction` twice — once as the field initialiser and
    // again, redundantly, as the first statement of the constructor.
    private static readonly DEFAULT_DIRECTION: number = 4;

    /**
     * Name DERIVED: AS3 writes these fifteen as bare `case` labels in two identical switches, one
     * in `savePartSetId()` and one in `savePartSetColourId()`. Hoisted to a set so the two cannot
     * drift apart — they are the same list in the source, and a part accepted by one but not the
     * other would produce a figure with a colour and no set, or the reverse.
     */
    // AS3: .../avatar/figuredata/FigureData.as::EDITABLE_PART_TYPES
    private static readonly EDITABLE_PART_TYPES: ReadonlySet<string> = new Set([
        'hd', 'hr', 'ha', 'he', 'ea', 'fa', 'ch', 'cc', 'ca', 'cp', 'lg', 'sh', 'wa', 'mc', 'pt'
    ]);

    // AS3: .../avatar/figuredata/FigureData.as::_avatarEditor
    // Narrowed to the one method AS3 calls on it — see `IFigureDataOwner`.
    private _avatarEditor: IFigureDataOwner | null;

    // AS3: .../avatar/figuredata/FigureData.as::_view
    // Name DERIVED (`_SafeStr_4550`). AS3 constructs its `FigureDataView` here; this port takes one
    // because the concrete view needs `AvatarEditorView`, which is not ported yet.
    private _view: IFigureDataView | null;

    // AS3: .../avatar/figuredata/FigureData.as::_partSets
    // Name DERIVED (`_SafeStr_4556`): part type → set id.
    private _partSets: Map<string, number> = new Map();

    // AS3: .../avatar/figuredata/FigureData.as::_colors
    // Part type → colour ids. A part may carry several, which is what the trailing `-` groups of a
    // figure string are.
    private _colors: Map<string, number[]> = new Map();

    // AS3: .../avatar/figuredata/FigureData.as::_gender
    // Name DERIVED (`_SafeStr_4645`).
    private _gender: string = FigureData.MALE;

    // AS3: .../avatar/figuredata/FigureData.as::_disposed
    // Name DERIVED (`_SafeStr_5769`).
    private _disposed: boolean = false;

    // AS3: .../avatar/figuredata/FigureData.as::_direction
    // Name DERIVED (`_SafeStr_4615`).
    private _direction: number = FigureData.DEFAULT_DIRECTION;

    // AS3: .../avatar/figuredata/FigureData.as::FigureData()
    constructor(avatarEditor: IFigureDataOwner | null, view: IFigureDataView | null = null)
    {
        this._direction = FigureData.DEFAULT_DIRECTION;
        this._avatarEditor = avatarEditor;

        // AS3 builds its own `FigureDataView(this)` here unconditionally. The parameter is this
        // port's addition, kept so a caller can inject one; left null it now behaves as AS3 does.
        // The editor's window already exists by this point — `HabboAvatarEditor.init()` builds the
        // view before the figures, precisely so this lookup finds the preview slot.
        this._view = view ?? new FigureDataView(avatarEditor);
    }

    // AS3: .../avatar/figuredata/FigureData.as::get disposed()
    public get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: .../avatar/figuredata/FigureData.as::get view()
    public get view(): IFigureDataView | null
    {
        return this._view;
    }

    // AS3: .../avatar/figuredata/FigureData.as::get gender()
    public get gender(): string
    {
        return this._gender;
    }

    // AS3: .../avatar/figuredata/FigureData.as::get avatarEditor()
    public get avatarEditor(): IFigureDataOwner | null
    {
        return this._avatarEditor;
    }

    // AS3: .../avatar/figuredata/FigureData.as::get direction()
    public get direction(): number
    {
        return this._direction;
    }

    // AS3: .../avatar/figuredata/FigureData.as::set direction()
    // This one *does* refresh: turning the avatar is a visible act.
    public set direction(value: number)
    {
        this._direction = value;

        this.updateView();
    }

    /**
     * Replaces the whole figure. Both maps are **re-created**, not cleared in place, so nothing of
     * the previous figure survives — a part present before and absent now is genuinely gone.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/figuredata/FigureData.as::loadAvatarData()
    public loadAvatarData(figureString: string, gender: string): void
    {
        this._partSets = new Map();
        this._colors = new Map();
        this._gender = gender;

        this.parseFigureString(figureString);
        this.updateView();
    }

    // AS3: .../avatar/figuredata/FigureData.as::getPartSetId()
    public getPartSetId(partType: string): number
    {
        return this._partSets.get(partType) ?? -1;
    }

    /**
     * The colours recorded for a part — or, when none are, a one-element array holding the
     * editor's default for that part. The fallback is why an unset part still serialises with a
     * colour rather than bare.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/figuredata/FigureData.as::getColourIds()
    public getColourIds(partType: string): number[]
    {
        const colors = this._colors.get(partType);

        if(colors !== undefined) return colors;

        return [this._avatarEditor?.getDefaultColour(partType) ?? -1];
    }

    /**
     * Serialises to `type-set-colour[-colour…]` groups joined by `.`.
     *
     * The order is the maps' own insertion order, not a canonical one — a figure parsed and
     * re-serialised keeps its original part order, but one built by clicking comes out in click
     * order. The server accepts either.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/figuredata/FigureData.as::getFigureString()
    public getFigureString(): string
    {
        const groups: string[] = [];

        for(const [partType, setId] of this._partSets)
        {
            let group = `${partType}-${setId}`;

            for(const colour of this._colors.get(partType) ?? [])
            {
                group += `-${colour}`;
            }

            groups.push(group);
        }

        return groups.join('.');
    }

    /**
     * Serialises **only the head**, with its set id replaced by the one given — the face-picker's
     * preview, which shows a candidate face on the current colours.
     *
     * AS3 builds a one-element array to loop over and guards `_colors[part] != null` before
     * reading the set id, so a head with no colour recorded yields the empty string rather than a
     * bare `hd-<id>`. Kept.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/figuredata/FigureData.as::getFigureStringWithFace()
    public getFigureStringWithFace(setId: number): string
    {
        const groups: string[] = [];

        for(const partType of ['hd'])
        {
            const colors = this._colors.get(partType);

            if(colors === undefined) continue;

            let group = `${partType}-${setId}`;

            // AS3 appends the colours only for a non-negative set id, so a negative one
            // serialises bare.
            if(setId >= 0)
            {
                for(const colour of colors) group += `-${colour}`;
            }

            groups.push(group);
        }

        return groups.join('.');
    }

    // AS3: .../avatar/figuredata/FigureData.as::savePartData()
    // Writes the set and the colours in one go; `update` false lets a caller batch several parts
    // and refresh once.
    public savePartData(partType: string, setId: number, colourIds: number[], update: boolean = false): void
    {
        this.savePartSetId(partType, setId, update);
        this.savePartSetColourId(partType, colourIds, update);
    }

    /**
     * Records a part's colours. Unlike `savePartSetId()`, a negative or empty value is **not**
     * special-cased — whatever is passed is stored, so clearing a part means clearing its set.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/figuredata/FigureData.as::savePartSetColourId()
    public savePartSetColourId(partType: string, colourIds: number[], update: boolean = true): void
    {
        if(FigureData.EDITABLE_PART_TYPES.has(partType))
        {
            this._colors.set(partType, colourIds);
        }

        if(update) this.updateView();
    }

    // AS3: .../avatar/figuredata/FigureData.as::updateView()
    public updateView(): void
    {
        this._view?.update(this.getFigureString(), this._direction);
    }

    // AS3: .../avatar/figuredata/FigureData.as::avatarImageReady()
    // Ignores the figure string it is handed and re-reads its own — so a late image for a figure
    // the user has since changed still triggers a refresh of the *current* one.
    public avatarImageReady(_figureString: string): void
    {
        this.updateView();
    }

    // AS3: .../avatar/figuredata/FigureData.as::dispose()
    // Does not dispose the view — AS3 drops the reference and leaves it to the editor.
    public dispose(): void
    {
        this._avatarEditor = null;
        this._view = null;
        this._partSets = new Map();
        this._colors = new Map();
        this._disposed = true;
    }

    /**
     * Parses `type-set[-colour…]` groups separated by `.`.
     *
     * A group with no colours is given the single colour **0** rather than none, which is what
     * makes a bare `hr-100` round-trip as `hr-100-0`. And the set id is parsed with no validation:
     * a malformed group yields `NaN`, which `savePartSetId()` then rejects on its `>= 0` test.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/figuredata/FigureData.as::parseFigureString()
    private parseFigureString(figureString: string | null): void
    {
        if(figureString === null) return;

        for(const group of figureString.split('.'))
        {
            const parts = group.split('-');

            if(parts.length === 0) continue;

            const partType = String(parts[0]);
            const setId = parseInt(parts[1], 10);
            const colourIds: number[] = [];

            for(let index = 2; index < parts.length; index++)
            {
                colourIds.push(Number(parts[index]));
            }

            if(colourIds.length === 0) colourIds.push(0);

            this.savePartSetId(partType, setId, false);
            this.savePartSetColourId(partType, colourIds, false);
        }
    }

    /**
     * Records a part's set id — or **removes** the part when the id is negative, which is how the
     * "no item" thumbnail clears a slot.
     *
     * An id that is not a number fails the `>= 0` test and therefore deletes too.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/figuredata/FigureData.as::savePartSetId()
    private savePartSetId(partType: string, setId: number, update: boolean = true): void
    {
        if(FigureData.EDITABLE_PART_TYPES.has(partType))
        {
            if(setId >= 0) this._partSets.set(partType, setId);
            else this._partSets.delete(partType);
        }

        if(update) this.updateView();
    }
}
