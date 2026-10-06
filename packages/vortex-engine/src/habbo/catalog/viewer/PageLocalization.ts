import type {IPageLocalization} from './IPageLocalization';

/**
 * @see sources/win63_version/habbo/catalog/viewer/PageLocalization.as
 */
export class PageLocalization implements IPageLocalization
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/PageLocalization.as::HEADER_IMAGE
    static readonly HEADER_IMAGE: string = 'catalog.header.image';
    static readonly HEADER_ICON: string = 'catalog.header.icon';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/PageLocalization.as::HEADER_TITLE
    static readonly HEADER_TITLE: string = 'catalog.header.title';
    static readonly HEADER_DESCRIPTION: string = 'catalog.header.description';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/PageLocalization.as::DEFAULT_TEXT_FIELDS
    private static readonly DEFAULT_TEXT_FIELDS: string[] =
        ['catalog.header.description', 'ctlg_description', 'ctlg_special_txt', 'ctlg_text_1', 'ctlg_text_2'];

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/PageLocalization.as::DEFAULT_IMAGE_FIELDS
    private static readonly DEFAULT_IMAGE_FIELDS: string[] =
        ['catalog.header.image', 'ctlg_teaserimg_1', 'ctlg_special_img', 'ctlg_teaserimg_2', 'ctlg_teaserimg_3'];

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/PageLocalization.as::LAYOUTS_IMAGE_FIELDS
    private static readonly LAYOUTS_IMAGE_FIELDS: Map<string, string[]> = new Map([
        ['frontpage4', ['catalog.header.image', 'ctlg_teaserimg_1']],
    ]);

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/PageLocalization.as::LAYOUTS_TEXT_FIELDS
    private static readonly LAYOUTS_TEXT_FIELDS: Map<string, string[]> = new Map([
        ['camera1', ['catalog.header.description', 'ctlg_text_1']],
        ['presents', ['catalog.header.description', 'ctlg_text1']],
        ['pets', ['catalog.header.description', 'ctlg_text_1', 'ctlg_text_2', 'ctlg_text_3']],
        ['pets2', ['catalog.header.description', 'ctlg_text_1', 'ctlg_text_2', 'ctlg_text_3']],
        ['pets3', ['catalog.header.description', 'ctlg_text_1', 'ctlg_text_2', 'ctlg_text_3']],
        ['info_rentables', ['catalog.header.description', 'ctlg_text_1', 'ctlg_text_2', 'ctlg_text_3', 'ctlg_text_4', 'ctlg_text_5']],
        ['info_duckets', ['ctlg_description']],
        ['info_loyalty', ['ctlg_description']],
        ['trophies', ['trophy.description', 'trophy.enscription']],
        // AS3 sets LAYOUTS_TEXT_FIELDS["frontpage4"] twice - the camera1-style entry above is
        // immediately overwritten by this one, matching the real, order-dependent AS3 behavior.
        ['frontpage4', ['ctlg_txt1', 'ctlg_txt2']],
    ]);

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/PageLocalization.as::LAYOUT_LINKS
    private static readonly LAYOUT_LINKS: Map<string, string[]> = new Map([
        ['club_buy', ['club_link']],
        ['mad_money', ['ctlg_madmoney_button']],
        ['monkey', ['ctlg_teaserimg_1_region', 'ctlg_special_img_region']],
        ['niko', ['ctlg_teaserimg_1_region', 'ctlg_special_img_region']],
        ['pets3', ['ctlg_text_3']],
    ]);

    private _images: string[];

    private _texts: string[];

    constructor(images: string[], texts: string[])
    {
        this._images = images;
        this._texts = texts;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/PageLocalization.as::get imageCount()
    get imageCount(): number
    {
        return this._images.length;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/PageLocalization.as::get textCount()
    get textCount(): number
    {
        return this._texts.length;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/PageLocalization.as::dispose()
    dispose(): void
    {
        this._images = [];
        this._texts = [];
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/PageLocalization.as::hasLinks()
    hasLinks(layoutCode: string): boolean
    {
        return PageLocalization.LAYOUT_LINKS.get(layoutCode) != null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/PageLocalization.as::getLinks()
    getLinks(layoutCode: string): string[]
    {
        return PageLocalization.LAYOUT_LINKS.get(layoutCode) ?? [];
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/PageLocalization.as::getTextElementName()
    getTextElementName(index: number, layoutCode: string): string
    {
        const fields = PageLocalization.LAYOUTS_TEXT_FIELDS.get(layoutCode) ?? PageLocalization.DEFAULT_TEXT_FIELDS;

        return index < fields.length ? fields[index] : '';
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/PageLocalization.as::getImageElementName()
    getImageElementName(index: number, layoutCode: string): string
    {
        const fields = PageLocalization.LAYOUTS_IMAGE_FIELDS.get(layoutCode) ?? PageLocalization.DEFAULT_IMAGE_FIELDS;

        return index < fields.length ? fields[index] : '';
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/PageLocalization.as::getTextElementContent()
    getTextElementContent(index: number): string
    {
        return index < this._texts.length ? this._texts[index] : '';
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/PageLocalization.as::getImageElementContent()
    getImageElementContent(index: number): string
    {
        return index < this._images.length ? this._images[index] : '';
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/PageLocalization.as::getColorUintFromText()
    // Decompiled as `uint(Number(null))` (always 0) - the obvious intended value is the
    // just-computed "#"->"0x" hex string, confirmed against the clean reference source.
    getColorUintFromText(index: number): number
    {
        if(index < this._texts.length)
        {
            const hex = this._texts[index].replace('#', '0x');

            return Number(hex) >>> 0;
        }

        return 0;
    }
}
