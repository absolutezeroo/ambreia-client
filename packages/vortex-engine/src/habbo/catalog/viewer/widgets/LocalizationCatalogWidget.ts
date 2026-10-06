import {Logger} from '@core/utils/Logger';
import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IBitmapWrapperWindow} from '@core/window/components/IBitmapWrapperWindow';
import type {IStaticBitmapWrapperWindow} from '@core/window/components/IStaticBitmapWrapperWindow';
import {TextWindowUtils} from '@habbo/utils/TextWindowUtils';
import {HabboWebTools} from '@habbo/utils/HabboWebTools';
import type {IHTMLTextWindow} from '@core/window/components/IHTMLTextWindow';
import {WindowMouseEvent} from '@core/window/events/WindowMouseEvent';
import {type AssetLoaderEvent, AssetLoaderEventType} from '@core/assets/loaders/AssetLoaderEvent';
import type {HabboCatalog} from '../../HabboCatalog';
import {SelectProductEvent} from './events/SelectProductEvent';
import {CatalogWidget} from './CatalogWidget';
import {AssetBitmap} from '@core/assets/AssetBitmap';

const log = Logger.getLogger('habbo.catalog.viewer.widgets.LocalizationCatalogWidget');

/**
 * Applies a page's PageLocalization text/image fields (and the catalog main window's
 * category header title/description/icon) to the actual window elements.
 *
 * Its second job is the link switch: a handful of hand-built catalog pages carry named link
 * elements whose destination is decided by the page's `layoutCode`, not by the link itself. Two
 * of them read the destination out of the page's own localization text — `frontpage3`'s two links
 * are the front page's editorial slots, and their target changes with whatever the hotel put
 * there this week.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/LocalizationCatalogWidget.as
 */
export class LocalizationCatalogWidget extends CatalogWidget
{
    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/LocalizationCatalogWidget.as::_catalog
    private _catalog: HabboCatalog | null;

    private _imageElementMap: Map<string, string> = new Map();

    constructor(window: IWindowContainer, catalog: HabboCatalog)
    {
        super(window);
        this._catalog = catalog;
    }

    override dispose(): void
    {
        if(this.disposed) return;

        this.events.off(SelectProductEvent.SELECT_PRODUCT, this.onProductSelected);
        this._catalog = null;
        super.dispose();
    }

    override init(): boolean
    {
        if(!super.init()) return false;

        this.initLocalizables();
        this.initStaticImages();
        this.initLinks();
        this.events.on(SelectProductEvent.SELECT_PRODUCT, this.onProductSelected);

        return true;
    }

    private onProductSelected = (_event: SelectProductEvent): void =>
    {
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/LocalizationCatalogWidget.as::initLinks()
    private initLinks(): void
    {
        if(!this.page.hasLinks) return;

        for(const linkName of this.page.links)
        {
            const linkWindow = this.window.findChildByName(linkName);

            if(linkWindow != null)
            {
                linkWindow.setParamFlag(1);
                linkWindow.mouseThreshold = 0;
                linkWindow.addEventListener(WindowMouseEvent.CLICK, this.onClickLink);
            }
        }
    }

    /**
     * Where a named link on a hand-built page goes.
     *
     * The two `frontpage3` cases check the caption first: an empty slot still has its link window,
     * and clicking blank space must not open whatever the *previous* week's text pointed at.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/LocalizationCatalogWidget.as::onClickLink()
    private onClickLink = (event: WindowMouseEvent): void =>
    {
        const target = event.target as unknown as IWindow | null;
        const name = target?.name ?? '';
        const catalog = this._catalog;

        if(catalog === null) return;

        switch(this.page.layoutCode)
        {
            case 'frontpage3':
                if(name === 'ctlg_txt3' && target?.caption !== '')
                {
                    catalog.openCatalogPage(this.page.localization.getTextElementContent(6));
                }
                else if(name === 'ctlg_txt7' && target?.caption !== '')
                {
                    const destination = this.page.localization.getTextElementContent(10);

                    // Three kinds of destination behind one slot: an external URL, the literal
                    // "credits" (the web shop), or a catalog page name.
                    if(destination.indexOf('http') >= 0) this.openExternalLink(destination);
                    else if(destination === 'credits') HabboWebTools.openWebPageAndMinimizeClient(catalog.getProperty('web.shop.relativeUrl'));
                    else catalog.openCatalogPage(destination);
                }

                break;
            case 'info_pixels':
                if(name === 'ctlg_text_5') catalog.questEngine?.showAchievements();
                else if(name === 'ctlg_text_7') catalog.openCatalogPage(this.page.localization.getTextElementContent(7));

                break;
            case 'info_credits':
                if(name === 'ctlg_text_5') HabboWebTools.openWebPageAndMinimizeClient(catalog.getProperty('web.shop.relativeUrl'));
                else if(name === 'ctlg_text_7') catalog.openCatalogPage(this.page.localization.getTextElementContent(7));

                break;
            case 'collectibles':
                if(name === 'ctlg_collectibles_link') this.openExternalLink(catalog.getProperty('link.format.collectibles'));

                break;
            case 'club1':
                if(name === 'ctlg_text_5') catalog.openCatalogPage('hc_membership');

                break;
            case 'club_buy':
                if(name === 'club_link') this.openExternalLink(catalog.getProperty('link.format.club'));

                break;
            case 'mad_money':
                if(name === 'ctlg_madmoney_button') this.openExternalLink(catalog.getProperty('link.format.madmoney'));

                break;
            // Two App Store teasers from the Flash era. The defaults are AS3's own, hard-coded
            // fallbacks — they are what ships when the hotel defines no override.
            case 'monkey':
                if(name === 'ctlg_teaserimg_1_region' || name === 'ctlg_special_img_region')
                {
                    this.openExternalLink(catalog.localization?.getLocalization('link.format.monkey', 'http://store.apple.com/') ?? '');
                }

                break;
            case 'niko':
                if(name === 'ctlg_teaserimg_1_region' || name === 'ctlg_special_img_region')
                {
                    this.openExternalLink(
                        catalog.localization?.getLocalization('link.format.niko', 'http://itunes.apple.com/us/app/niko/id481670205?mt=8') ?? ''
                    );
                }

                break;
            default:
                log.debug(`Unhandled link clicked ${[this.page.layoutCode, name]}`);
        }
    };

    /**
     * Opens a link outside the client, behind a confirmation.
     *
     * The alert and the navigation happen *together* in AS3, not one after the other: the page is
     * opened immediately and the alert is the notice, not a gate. Transcribed as found.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/LocalizationCatalogWidget.as::openExternalLink()
    private openExternalLink(url: string): void
    {
        if(url === '') return;

        this._catalog?.windowManager?.alert(
            '${catalog.alert.external.link.title}',
            '${catalog.alert.external.link.desc}',
            0,
            (dialog) => dialog.dispose()
        );

        HabboWebTools.navigateToURL(url, HabboWebTools.WINDOW_HABBO_MAIN);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/LocalizationCatalogWidget.as::initStaticImages()
    private initStaticImages(): void
    {
        const staticImages: IWindow[] = [];

        this.window.groupChildrenWithTag('STATIC_IMAGE', staticImages, 10);

        for(const child of staticImages)
        {
            const bitmapWrapper = child as unknown as IBitmapWrapperWindow;

            if(bitmapWrapper == null) continue;

            const name = child.name;

            this._imageElementMap.set(name, name);

            if(this._catalog!.assets!.hasAsset(name))
            {
                this.setElementImage(name, name);
            }
            else
            {
                this.retrieveCatalogImage(name);
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/LocalizationCatalogWidget.as::initLocalizables()
    private initLocalizables(): void
    {
        this._imageElementMap.clear();

        const headerDescription = this._catalog!.mainContainer?.findChildByName('catalog.header.description');

        if(headerDescription != null)
        {
            headerDescription.caption = '';
        }

        const localization = this.page.localization;

        for(let i = 0; i < localization.textCount; i++)
        {
            const elementName = localization.getTextElementName(i, this.page.layoutCode);
            const content = localization.getTextElementContent(i);

            const target = elementName === 'catalog.header.description'
                ? this._catalog!.mainContainer?.findChildByName(elementName) ?? null
                : this.window.findChildByName(elementName);

            if(target != null)
            {
                target.caption = content.replace(/\r\n/g, '\n');

                const htmlText = target as unknown as IHTMLTextWindow;

                if(htmlText != null && 'styleSheet' in htmlText)
                {
                    target.addEventListener('WE_LINK', this.onClickHtmlLink);
                    this.setLinkStyle(htmlText);
                }
            }
            else
            {
                log.warn(`Could not place text in layout: element: ${elementName}, content: ${content}`);
            }
        }

        for(let i = 0; i < localization.imageCount; i++)
        {
            const elementName = localization.getImageElementName(i, this.page.layoutCode);
            const content = localization.getImageElementContent(i);

            if(elementName !== '' && content !== '')
            {
                this._imageElementMap.set(content, elementName);

                if(this._catalog!.assets!.hasAsset(content))
                {
                    this.setElementImage(elementName, content);
                }
                else
                {
                    this.retrieveCatalogImage(content);
                }
            }
        }

        const node = this._catalog!.currentCatalogNavigator?.getNodeById(this.page.pageId) ?? null;
        const headerTitle = this._catalog!.mainContainer?.findChildByName('catalog.header.title');
        const headerIcon = this._catalog!.mainContainer?.findChildByName('catalog.header.icon') as unknown as IStaticBitmapWrapperWindow | null;

        if(headerTitle != null)
        {
            headerTitle.caption = node != null ? node.localization : (this.page.mode === 1 ? '${catalog.search.header}' : '${catalog.header}');
        }

        if(headerIcon != null && node != null)
        {
            headerIcon.assetUri = this.page.mode === 1
                ? 'common_small_pen'
                : `${this._catalog!.imageGalleryHost}${node.iconName}.png`;
        }
    }

    private onClickHtmlLink = (_event: unknown): void =>
    {
    };

    /**
     * The catalog's own link palette — dark grey rather than the blue
     * `HTMLTextController.initializeLinkStyle()` paints, because these links sit on the page's
     * light background.
     */
    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/LocalizationCatalogWidget.as::setLinkStyle()
    private setLinkStyle(target: IHTMLTextWindow): void
    {
        if(!target) return;

        TextWindowUtils.setHTMLLinkStyle(target, 0x336A95, 0x333333, 0x41B7D9);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/LocalizationCatalogWidget.as::setElementImage()
    private setElementImage(elementName: string, assetName: string): void
    {
        if(this.window == null || this.window.disposed) return;

        const target = elementName === 'catalog.header.image'
            ? this._catalog!.mainContainer?.findChildByName(elementName) ?? null
            : this.window.findChildByName(elementName);

        if(target == null) return;

        const bitmapWrapper = target as unknown as IBitmapWrapperWindow;

        if('bitmap' in bitmapWrapper)
        {
            const asset = this._catalog!.assets!.getAssetByName(assetName);

            if(asset == null)
            {
                log.warn(`Asset does not exist (Bitmap window): ${[elementName, assetName]}`);

                return;
            }

            // A bitmap asset's content is a PixiJS Texture, not an ImageBitmap
            // — the `as ImageBitmap` this used to do was a lie the compiler
            // could not catch (IAsset.content is `unknown`), and the Texture
            // reached drawImage() in BitmapDataRenderer, which threw and took
            // the whole window-manager render pass down with it every frame.
            // This is what made `ctlg_teaserimg_1` break the UI.
            const bitmap = AssetBitmap.resolveSync(asset.content);

            if(bitmap)
            {
                bitmapWrapper.bitmap = bitmap;

                return;
            }

            // Atlas sub-frame: needs a copy, so it lands a microtask later.
            // Re-check the window on the way back — a catalogue page change can
            // dispose it in between.
            void AssetBitmap.resolve(asset.content).then((resolved) =>
            {
                if(resolved && this.window != null && !this.window.disposed) bitmapWrapper.bitmap = resolved;
            });

            return;
        }

        const staticBitmapWrapper = target as unknown as IStaticBitmapWrapperWindow;

        if('assetUri' in staticBitmapWrapper)
        {
            staticBitmapWrapper.assetUri = `${this._catalog!.getProperty('image.library.catalogue.url')}${assetName}.gif`;

            return;
        }

        log.warn(`Could not find element: ${elementName}`);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/LocalizationCatalogWidget.as::retrieveCatalogImage()
    private retrieveCatalogImage(assetName: string): void
    {
        const catalog = this._catalog!;
        const catalogueImageUrl = catalog.getProperty('image.library.catalogue.url');
        const topStoryImageUrl = `${catalog.getProperty('image.library.url')}Top_Story_Images/`;
        const elementName = this._imageElementMap.get(assetName) ?? '';

        const target = elementName === 'catalog.header.image'
            ? catalog.mainContainer?.findChildByName(elementName) ?? null
            : this.window.findChildByName(elementName);

        const baseUrl = target != null && target.tags.indexOf('TOP_STORY') > -1
            ? topStoryImageUrl
            : catalogueImageUrl;

        const url = `${baseUrl}${assetName}.gif`;
        const loader = catalog.assets?.loadAssetFromFile(assetName, url, 'image/gif') ?? null;

        if(loader == null)
        {
            log.warn(`Failed to start loading catalog image: ${assetName}`);

            return;
        }

        loader.events.on('event', (event: AssetLoaderEvent) =>
        {
            if(event.type === AssetLoaderEventType.COMPLETE)
            {
                this.onCatalogImageReady(assetName);
            }
        });
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/LocalizationCatalogWidget.as::onCatalogImageReady()
    private onCatalogImageReady(assetName: string): void
    {
        const elementName = this._imageElementMap.get(assetName);

        if(elementName != null)
        {
            this.setElementImage(elementName, assetName);
        }
    }
}
