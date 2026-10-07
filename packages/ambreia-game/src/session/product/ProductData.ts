import type {IProductData} from './IProductData';

/**
 * Product data implementation
 *
 * @see source_as_win63/habbo/session/product/ProductData.as
 * @see source_as_flash/com/sulake/habbo/session/product/ProductData.as
 */
export class ProductData implements IProductData
{
    constructor(type: string, name: string, description: string = '')
    {
        this._type = type;
        this._name = name;
        this._description = description;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/product/ProductData.as::_type
    private _type: string;

    // AS3: .../src/com/sulake/habbo/session/product/ProductData.as::get type()
    get type(): string
    {
        return this._type;
    }

    // AS3: .../src/com/sulake/habbo/session/product/ProductData.as::_name
    private _name: string;

    // AS3: .../src/com/sulake/habbo/session/product/ProductData.as::get name()
    get name(): string
    {
        return this._name;
    }

    // AS3: .../src/com/sulake/habbo/session/product/ProductData.as::_description
    private _description: string;

    // AS3: .../src/com/sulake/habbo/session/product/ProductData.as::get description()
    get description(): string
    {
        return this._description;
    }
}
