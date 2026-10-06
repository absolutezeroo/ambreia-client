import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IPurchasableOffer} from '../IPurchasableOffer';
import type {ICatalogViewer} from './ICatalogViewer';
import type {IPageLocalization} from './IPageLocalization';

/**
 * A loaded catalog page: its window, offers, and localization/layout metadata.
 *
 * @see sources/win63_version/habbo/catalog/viewer/class_2044.as
 */
export interface ICatalogPage
{
    // AS3: sources/win63_version/habbo/catalog/viewer/class_2044.as::dispose()
    dispose(): void;

    // AS3: sources/win63_version/habbo/catalog/viewer/class_2044.as::init()
    init(): void;

    // AS3: sources/win63_version/habbo/catalog/viewer/class_2044.as::closed()
    closed(): void;

    // AS3: sources/win63_version/habbo/catalog/viewer/class_2044.as::dispatchWidgetEvent()
    dispatchWidgetEvent(event: unknown): boolean;

    // AS3: sources/win63_version/habbo/catalog/viewer/class_2044.as::get window()
    readonly window: IWindowContainer;

    // AS3: sources/win63_version/habbo/catalog/viewer/class_2044.as::get viewer()
    readonly viewer: ICatalogViewer;

    // AS3: sources/win63_version/habbo/catalog/viewer/class_2044.as::get pageId()
    readonly pageId: number;

    // AS3: sources/win63_version/habbo/catalog/viewer/class_2044.as::get offers()
    readonly offers: IPurchasableOffer[];

    // AS3: sources/win63_version/habbo/catalog/viewer/class_2044.as::get localization()
    readonly localization: IPageLocalization;

    // AS3: sources/win63_version/habbo/catalog/viewer/class_2044.as::get layoutCode()
    readonly layoutCode: string;

    // AS3: sources/win63_version/habbo/catalog/viewer/class_2044.as::get hasLinks()
    readonly hasLinks: boolean;

    // AS3: sources/win63_version/habbo/catalog/viewer/class_2044.as::get links()
    readonly links: string[];

    // AS3: sources/win63_version/habbo/catalog/viewer/class_2044.as::selectOffer()
    selectOffer(offerId: number): void;

    // AS3: sources/win63_version/habbo/catalog/viewer/class_2044.as::replaceOffers()
    replaceOffers(offers: IPurchasableOffer[], keepSelection?: boolean): void;

    // AS3: sources/win63_version/habbo/catalog/viewer/class_2044.as::updateLimitedItemsLeft()
    updateLimitedItemsLeft(offerId: number, itemsLeft: number): void;

    // AS3: sources/win63_version/habbo/catalog/viewer/class_2044.as::get acceptSeasonCurrencyAsCredits()
    readonly acceptSeasonCurrencyAsCredits: boolean;

    // AS3: sources/win63_version/habbo/catalog/viewer/class_2044.as::get allowDragging()
    readonly allowDragging: boolean;

    searchPageId: number;

    // AS3: sources/win63_version/habbo/catalog/viewer/class_2044.as::get mode()
    readonly mode: number;
}
