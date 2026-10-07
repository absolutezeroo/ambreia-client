import type {IDisposable} from '@ambreia/common/IDisposable';

/**
 * Listener interface for product data ready events
 * @see source_as_win63/habbo/session/product/class_1812.as (extends IDisposable)
 * @see source_as_flash/com/sulake/habbo/session/product/IProductDataListener.as
 */
export interface IProductDataListener extends IDisposable
{
    productDataReady(): void;
}
