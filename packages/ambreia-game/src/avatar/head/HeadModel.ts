import type {ICategoryModel} from '../common/ICategoryModel';
import type {ICategoryModelOwner} from '../common/ICategoryModelOwner';
import {CategoryBaseModel} from '../common/CategoryBaseModel';
import {HeadView} from './HeadView';

/**
 * The hair and headwear page: hair, hat, head accessory, eye accessory and face accessory.
 *
 * Nothing but an `init()`: the part types this page owns, then its view. Every behaviour is
 * `CategoryBaseModel`'s.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/head/HeadModel.as
 */
export class HeadModel extends CategoryBaseModel implements ICategoryModel
{
    // AS3: .../avatar/head/HeadModel.as::HeadModel()
    constructor(controller: ICategoryModelOwner | null)
    {
        super(controller);
    }

    /**
     * AS3: .../avatar/head/HeadModel.as::init()
     *
     * The `_initialised` flag is set **before** the view is built, as in AS3 — `HeadView.init()`
     * calls straight back into `switchCategory()`, and the flag is what stops that re-entering
     * here.
     */
    protected override init(): void
    {
        super.init();

        this.initCategory('hr');
        this.initCategory('ha');
        this.initCategory('he');
        this.initCategory('ea');
        this.initCategory('fa');
        this._initialised = true;

        if(this._view === null)
        {
            this._view = new HeadView(this);
            this._view.init();
        }
    }
}
