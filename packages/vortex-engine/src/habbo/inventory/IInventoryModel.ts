import type {IDisposable} from '@core/runtime/IDisposable';
import type {IWindowContainer} from '@core/window/IWindowContainer';

/**
 * IInventoryModel
 *
 * Common contract every inventory category model (furni, badges, pets, bots,
 * effects, trading, marketplace, recycler) implements so that
 * InventoryMainView/HabboInventory can drive it generically by category name.
 *
 * @see sources/win63_version/habbo/inventory/IInventoryModel.as
 */
export interface IInventoryModel extends IDisposable
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/IInventoryModel.as::getWindowContainer()
    getWindowContainer(): IWindowContainer | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/IInventoryModel.as::requestInitialization()
    requestInitialization(): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/IInventoryModel.as::categorySwitch()
    categorySwitch(category: string): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/IInventoryModel.as::subCategorySwitch()
    subCategorySwitch(category: string): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/IInventoryModel.as::closingInventoryView()
    closingInventoryView(): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/IInventoryModel.as::updateView()
    updateView(): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/IInventoryModel.as::selectItemById()
    selectItemById(itemId: string): void;
}
