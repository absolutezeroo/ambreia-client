/**
 * InfoStandPetView
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as
 *
 * The pet infostand panel: name, rendered pet image, level/breed/age, respect count, the
 * happiness/experience/energy bars, and the action button strip. Structure follows InfoStandFurniView, the sibling that already works against the
 * same `info_border` / `infostand_element_list` / `button_list` layout shape.
 *
 * AS3 caches the last InfoStandPetData per pet id purely to feed PetCommandTool on a later
 * openTrainView(); that cache is kept (_petDataCache) and is what openTrainView() reads.
 *
 * The RPG fork removed monsterplants and pet feeding: AS3's monsterplant panel (well-being bar,
 * growth countdown, rarity line and overlay), its treat / move / rotate buttons and the
 * buy-food button are not ported. The layout still ships those children; they are kept hidden.
 */
import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IItemListWindow} from '@core/window/components/IItemListWindow';
import type {ITextWindow} from '@core/window/components/ITextWindow';
import type {IBitmapWrapperWindow} from '@core/window/components/IBitmapWrapperWindow';
import {WindowEvent} from '@core/window/events/WindowEvent';
import {WindowMouseEvent} from '@core/window/events/WindowMouseEvent';
import type {IHabboCatalog} from '@habbo/catalog/IHabboCatalog';
import {RoomWidgetFurniActionMessage} from '../messages/RoomWidgetFurniActionMessage';
import {RoomWidgetUserActionMessage} from '../messages/RoomWidgetUserActionMessage';
import type {CommandConfiguration} from './CommandConfiguration';
import {PetCommandTool} from './PetCommandTool';
import type {InfoStandPetData} from './InfoStandPetData';
import type {InfoStandWidget} from './InfoStandWidget';

// AS3 keeps its colours as uint literals and hands them to BitmapData.fillRect(); a canvas needs
// the CSS form, and going through toString(16) avoids hand-converting each constant.
function toCssColor(value: number): string
{
    return `#${value.toString(16).padStart(6, '0')}`;
}

export class InfoStandPetView
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::STATUS_BAR_WIDTH
    private static readonly STATUS_BAR_WIDTH = 162;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::STATUS_BAR_HEIGTH
    private static readonly STATUS_BAR_HEIGTH = 16;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::STATUS_BAR_HIGHLIGHT_HEIGHT
    private static readonly STATUS_BAR_HIGHLIGHT_HEIGHT = 4;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::STATUS_BAR_BORDER_COLOR
    private static readonly STATUS_BAR_BORDER_COLOR = 14342874;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::STATUS_BAR_BG_COLOR
    private static readonly STATUS_BAR_BG_COLOR = 3815994;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::STATUS_BAR_HAPPINESS_HIGHLIGHT_COLOR
    private static readonly STATUS_BAR_HAPPINESS_HIGHLIGHT_COLOR = 2085362;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::STATUS_BAR_HAPPINESS_CONTENT_COLOR
    private static readonly STATUS_BAR_HAPPINESS_CONTENT_COLOR = 39616;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::STATUS_BAR_EXPERIENCE_HIGHLIGHT_COLOR
    private static readonly STATUS_BAR_EXPERIENCE_HIGHLIGHT_COLOR = 10513106;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::STATUS_BAR_EXPERIENCE_CONTENT_COLOR
    private static readonly STATUS_BAR_EXPERIENCE_CONTENT_COLOR = 8734654;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::STATUS_BAR_ENERGY_HIGHLIGHT_COLOR
    private static readonly STATUS_BAR_ENERGY_HIGHLIGHT_COLOR = 9094430;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::STATUS_BAR_ENERGY_CONTENT_COLOR
    private static readonly STATUS_BAR_ENERGY_CONTENT_COLOR = 6200576;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::STATE_HAPPINESS
    private static readonly STATE_HAPPINESS = 'happiness';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::STATE_EXPERIENCE
    private static readonly STATE_EXPERIENCE = 'experience';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::STATE_ENERGY
    private static readonly STATE_ENERGY = 'energy';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::BUTTONS_MAX_WIDTH
    private static readonly BUTTONS_MAX_WIDTH = 250;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::BUTTON_HEIGHT
    private static readonly BUTTON_HEIGHT = 25;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::BUTTON_MARGIN
    private static readonly BUTTON_MARGIN = 5;

    // Type 15 is the one pet type with the enhancement skill indicator.
    private static readonly PET_TYPE_ENHANCEABLE = 15;

    private readonly _widget: InfoStandWidget;
    // AS3: .../src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::_catalog
    private readonly _catalog: IHabboCatalog | null;
    // AS3: .../src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::_window
    private _window: IItemListWindow | null = null;
    private _infoBorder: IWindowContainer | null = null;
    private _elementList: IItemListWindow | null = null;
    // AS3: .../src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::_buttonsContainer
    private _buttonsContainer: IWindowContainer | null = null;
    private _currentPetId: number = 0;
    private _petDataCache: Map<number, InfoStandPetData> | null = new Map();

    // Derived name: `_petCommandTool` is declared in no AS3 tree — the trace points
    // at the class it belongs to, but the identifier itself is this port's.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::_petCommandTool
    // Built lazily on the first openTrainView(), exactly as AS3 does.
    private _commandTool: PetCommandTool | null = null;

    // AS3 also grabs HabboTracking.getInstance() for the buy-food click, which the RPG fork removed
    // with pet feeding.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::InfoStandPetView()
    constructor(widget: InfoStandWidget, name: string, catalog: IHabboCatalog | null)
    {
        this._widget = widget;
        this._catalog = catalog;

        this.createWindow(name);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::get window()
    public get window(): IItemListWindow | null
    {
        return this._window;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::getCurrentPetId()
    public getCurrentPetId(): number
    {
        return this._currentPetId;
    }

    // DEVIATION: AS3 shows a monsterplant panel instead (well-being bar, growth countdown, rarity
    //   line and overlay, treat button, move/rotate for a plant) and offers buy-food on every other
    //   pet; the RPG fork removed monsterplants and pet feeding. Every pet gets the standard
    //   panel, and the plant-only and buy-food children of the layout stay hidden.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::update()
    public update(petData: InfoStandPetData): void
    {
        this.setName(petData.name);
        this.setImage(petData.image);
        this.setOwnerName(petData.ownerName);
        this.setBreedText(
            this._widget.localizations?.getLocalization(this.getBreedLocalizationKey(petData.type, petData.breedId)) ?? ''
        );
        this.updatePetRespect(petData.petRespect, true);
        this.setAgeText(petData.age);
        this.setLevelText(petData.level, petData.levelMax);
        this.setSpecialSkillLevel(petData.level, petData.skillTresholds, petData.type);

        const rarityText = this.getStatusContainer('default')?.getListItemByName('status_rarity_level') ?? null;

        if(rarityText) rarityText.visible = false;

        this.showStatusContainer('default', true);
        this.showStatusContainer('monsterplant', false);

        this.showButton('petrespect', true);
        this.showButton('pettreat', false);
        this.showButton('train', petData.isOwnPet);
        this.showButton('pick', petData.isOwnPet);
        this.showButton('buy_food', false);
        this.showButton('kick', petData.canRemovePet);

        this.updateStateElement(
            InfoStandPetView.STATE_HAPPINESS, petData.nutrition, petData.nutritionMax,
            InfoStandPetView.STATUS_BAR_HAPPINESS_CONTENT_COLOR, InfoStandPetView.STATUS_BAR_HAPPINESS_HIGHLIGHT_COLOR
        );
        this.updateStateElement(
            InfoStandPetView.STATE_EXPERIENCE, petData.experience, petData.experienceMax,
            InfoStandPetView.STATUS_BAR_EXPERIENCE_CONTENT_COLOR, InfoStandPetView.STATUS_BAR_EXPERIENCE_HIGHLIGHT_COLOR
        );
        this.updateStateElement(
            InfoStandPetView.STATE_ENERGY, petData.energy, petData.energyMax,
            InfoStandPetView.STATUS_BAR_ENERGY_CONTENT_COLOR, InfoStandPetView.STATUS_BAR_ENERGY_HIGHLIGHT_COLOR
        );
        this.updateRespectButton();

        this.showButton('move', false);
        this.showButton('rotate', false);

        this.updateWindow();

        this._currentPetId = petData.id;

        this._petDataCache?.delete(petData.id);
        this._petDataCache?.set(petData.id, petData);

        // AS3 refreshes an already-open PetCommandTool with the same arguments openTrainView()
        // passes, so a re-selected pet's skill bar follows its new data.
        this.showCommandToolForPetData(petData);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::updateImage()
    public updateImage(petId: number, image: ImageBitmap | null): void
    {
        if(this._currentPetId !== petId) return;

        this.setImage(image);
        this.updateWindow();

        this._commandTool?.updatePetImage(image);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::updateEnabledTrainingCommands()
    public updateEnabledTrainingCommands(petId: number, config: CommandConfiguration): void
    {
        if(this._commandTool === null) return;

        this._commandTool.setEnabledCommands(petId, config);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::openTrainView()
    public openTrainView(): void
    {
        if(this._commandTool === null) this._commandTool = new PetCommandTool(this._widget);

        const petData = this._petDataCache?.get(this._currentPetId) ?? null;

        if(petData === null) return;

        this._commandTool.showWindow(true);
        this.showCommandToolForPetData(petData);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::closeTrainView()
    public closeTrainView(): void
    {
        if(this._commandTool && this._commandTool.getPetId() === this._currentPetId)
        {
            this._commandTool.showWindow(false);
        }
    }

    // TS-only: no AS3 counterpart; AS3 spells this call out twice, in openTrainView() and at the
    // tail of update(). The argument list is identical in both, so it lives here once.
    private showCommandToolForPetData(petData: InfoStandPetData): void
    {
        if(this._commandTool === null) return;

        const lower = this.getLowerSkillTreshold(petData.level, petData.skillTresholds);
        const experienceRatio = petData.experience / petData.experienceMax;

        this._commandTool.showCommandToolForPet(
            petData.id,
            petData.name,
            petData.image,
            petData.type,
            petData.level - lower,
            experienceRatio,
            this.getUpperSkillTreshold(petData.level, petData.skillTresholds) - lower,
            petData.skillTresholds
        );
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::dispose()
    public dispose(): void
    {
        this._infoBorder = null;
        this._elementList = null;
        this._buttonsContainer = null;

        this._window?.dispose();
        this._window = null;

        this._commandTool?.dispose();
        this._commandTool = null;

        this._petDataCache?.clear();
        this._petDataCache = null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::createWindow()
    private createWindow(name: string): void
    {
        this._window = this._widget.windowManager.buildWidgetLayout('pet_view') as IItemListWindow | null;

        if(!this._window)
        {
            throw new Error('Failed to construct window from layout: pet_view');
        }

        this._infoBorder = this._window.getListItemByName('info_border') as IWindowContainer | null;

        if(this._infoBorder)
        {
            this._elementList = this._infoBorder.findChildByName('infostand_element_list') as IItemListWindow | null;
        }

        this._window.name = name;
        this._widget.mainContainer.addChild(this._window);

        this._infoBorder?.findChildByTag('close')?.addEventListener(WindowMouseEvent.CLICK, this.onClose);

        this._buttonsContainer = this._window.getListItemByName('button_list') as IWindowContainer | null;

        if(!this._buttonsContainer) return;

        const buttons: IWindow[] = [];

        this._buttonsContainer.groupChildrenWithTag('CMD_BUTTON', buttons, -1);

        for(const button of buttons) button.addEventListener(WindowMouseEvent.CLICK, this.onButtonClicked);

        this.setIcon('petrespect_icon', 'icon_petrespect');
        this.setIcon('status_happiness_icon', 'icon_pet_happiness');
        this.setIcon('status_experience_icon', 'icon_pet_experience');
        this.setIcon('status_energy_icon', 'icon_pet_energy');
        this.setIcon('skill_level_indicator', 'pet_skill_level_0');

        // AS3 runs this as a second pass over the same list, after the icons are in place.
        for(const button of buttons)
        {
            if(button.parent) button.parent.width = button.width;

            button.addEventListener(WindowEvent.WE_RESIZED, this.onButtonResized);
        }
    }

    // DEVIATION: AS3 also sets the monsterplant well-being icon; the RPG fork removed monsterplants.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::createWindow() (the six icon blocks)
    // AS3 repeats the same getAssetByName/clone/assign block per icon; folded into one helper.
    private setIcon(childName: string, assetName: string): void
    {
        const target = this._infoBorder?.findChildByName(childName) as IBitmapWrapperWindow | null;

        if(!target) return;

        const bitmap = (this._widget.assets?.getAssetByName(assetName)?.content ?? null) as ImageBitmap | null;

        if(bitmap) target.bitmap = bitmap;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::updateWindow()
    private updateWindow(): void
    {
        if(!this._window || !this._elementList || !this._infoBorder || !this._buttonsContainer) return;

        // AS3 opens updateWindow() with `_buttonsContainer.width = _buttonsContainer.width`, a
        // self-assign that only makes sense there if Flash's setter re-runs layout unconditionally.
        // In this port it is inert: WindowController's width setter is guarded by
        // `if(value !== this._width)` and returns immediately. Kept for AS3 traceability rather than
        // silently dropped — if the button strip ever fails to re-flow here, this is the line that
        // was supposed to do it, and arrangeButtons() is what actually sets the width in this port.
        // eslint-disable-next-line no-self-assign
        this._buttonsContainer.width = this._buttonsContainer.width;
        this._buttonsContainer.visible = this._buttonsContainer.width > 0;

        this._elementList.height = this._elementList.scrollableRegion.height;
        this._infoBorder.height = this._elementList.height + 20;

        this._window.width = Math.max(this._infoBorder.width, this._buttonsContainer.width);
        this._window.height = this._window.scrollableRegion.height;

        // Whichever of the two is narrower gets pushed to the right edge.
        if(this._infoBorder.width < this._buttonsContainer.width)
        {
            this._infoBorder.x = this._window.width - this._infoBorder.width;
            this._buttonsContainer.x = 0;
        }
        else
        {
            this._buttonsContainer.x = this._window.width - this._buttonsContainer.width;
            this._infoBorder.x = 0;
        }

        this._widget.refreshContainer();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::set name()
    private setName(value: string): void
    {
        const text = this._elementList?.getListItemByName('name_text') as ITextWindow | null;

        if(!text) return;

        text.text = value;
        text.visible = true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::set image()
    private setImage(value: ImageBitmap | null): void
    {
        if(!value || !this._elementList) return;

        const container = this._elementList.getListItemByName('image_container') as IWindowContainer | null;
        const target = container?.findChildByName('avatar_image') as IBitmapWrapperWindow | null;

        if(!target) return;

        // AS3 copyPixels() the pet into a transparent bitmap the size of the avatar_image slot,
        // centred — it does not scale. A canvas drawImage at the same offset is the equivalent.
        const canvas = new OffscreenCanvas(target.width, target.height);
        const context = canvas.getContext('2d');

        if(!context) return;

        context.drawImage(
            value,
            Math.round((target.width - value.width) / 2),
            Math.round((target.height - value.height) / 2)
        );

        target.bitmap = canvas.transferToImageBitmap();
        target.invalidate();

        this.updateWindow();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::setLevelText()
    // The text itself comes from the layout's ${pet.level} binding; AS3 only registers the
    // parameters and toggles visibility here — it never assigns .text. Same below for the age.
    private setLevelText(level: number, levelMax: number, visible: boolean = true): void
    {
        const container = this._elementList?.getListItemByName('image_container') as IWindowContainer | null;
        const text = container?.findChildByName('level_text') as ITextWindow | null;

        if(!text) return;

        text.visible = visible;

        this._widget.localizations?.registerParameter('pet.level', 'level', level.toString());
        this._widget.localizations?.registerParameter('pet.level', 'maxlevel', levelMax.toString());

        this.updateWindow();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::setSpecialSkillLevel()
    private setSpecialSkillLevel(level: number, skillTresholds: number[], petType: number): void
    {
        const container = this._elementList?.getListItemByName('image_container') as IWindowContainer | null;

        if(!container) return;

        const enhancementsEnabled = (this._widget.config?.getBoolean('pet.enhancements.enabled') ?? false)
            && petType === InfoStandPetView.PET_TYPE_ENHANCEABLE;
        const skillText = container.findChildByName('status_skill_text') as ITextWindow | null;

        if(skillText)
        {
            skillText.visible = enhancementsEnabled;
            skillText.caption = `\${infostand.pet.text.skill.${petType}}`;
        }

        const indicator = container.findChildByName('skill_level_indicator') as IBitmapWrapperWindow | null;

        if(indicator)
        {
            indicator.visible = enhancementsEnabled;

            const assetName = `pet_skill_level_${this.getSkillLevelIndex(level, skillTresholds)}`;
            const bitmap = (this._widget.assets?.getAssetByName(assetName)?.content ?? null) as ImageBitmap | null;

            if(bitmap) indicator.bitmap = bitmap;
        }

        this.updateWindow();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::set ownerName()
    private setOwnerName(value: string): void
    {
        this._widget.localizations?.registerParameter('infostand.text.petowner', 'name', value);
        this.updateWindow();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::set breedText()
    private setBreedText(value: string): void
    {
        const text = this._elementList?.getListItemByName('breed_text') as ITextWindow | null;

        if(!text) return;

        text.text = value;
        this.updateWindow();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::set ageText()
    // AS3 looks the window up and then never assigns to it — the ${pet.age} binding does the work —
    // but it does bail out early when the window is missing. Both behaviours kept.
    private setAgeText(age: number): void
    {
        const text = this._elementList?.getListItemByName('age_text') as ITextWindow | null;

        if(!text) return;

        this._widget.localizations?.registerParameter('pet.age', 'age', age.toString());
        this.updateWindow();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::updatePetRespect()
    private updatePetRespect(count: number, visible: boolean): void
    {
        this._widget.localizations?.registerParameter('infostand.text.petrespect', 'count', count.toString());

        const container = this._elementList?.getListItemByName('petrespect_container') as IWindowContainer | null;
        const text = container?.findChildByName('petrespect_text') as ITextWindow | null;
        const icon = container?.findChildByName('petrespect_icon') as IBitmapWrapperWindow | null;

        if(!text || !icon) return;

        text.visible = visible;
        icon.visible = visible;
        icon.x = text.x + text.width + 2;

        this.updateWindow();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::showStatusContainer()
    private showStatusContainer(name: string, visible: boolean): void
    {
        const container = this.getStatusContainer(name);

        if(container) container.visible = visible;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::getStatusContainer()
    private getStatusContainer(name: string): IItemListWindow | null
    {
        const container = this._elementList?.getListItemByName('status_container') as IWindowContainer | null;

        return (container?.findChildByName(`status_item_list_${name}`) as IItemListWindow | null) ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::updateStateElement()
    private updateStateElement(
        state: string,
        value: number,
        max: number,
        contentColor: number,
        highlightColor: number,
        overrideText: string | null = null
    ): void
    {
        const container = this._elementList?.getListItemByName('status_container') as IWindowContainer | null;

        if(!container) return;

        const text = container.findChildByName(`status_${state}_value_text`) as ITextWindow | null;

        if(text) text.text = overrideText ?? `${value}/${max}`;

        const target = container.findChildByName(`status_${state}_bitmap`) as IBitmapWrapperWindow | null;

        if(target)
        {
            const bar = this.createPercentageBar(value, max, contentColor, highlightColor);

            if(bar)
            {
                target.bitmap = bar;
                target.width = bar.width;
                target.height = bar.height;
                target.invalidate();
            }
        }

        this.updateWindow();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::createPercentageBar()
    // A 162x16 bar: 1px border, dark fill, then two stacked progress rects — a 4px highlight strip
    // above the main content band, both scaled to value/max.
    private createPercentageBar(value: number, max: number, contentColor: number, highlightColor: number): ImageBitmap | null
    {
        max = Math.max(max, 1);
        value = Math.max(value, 0);

        if(value > max) value = max;

        const ratio = value / max;
        const canvas = new OffscreenCanvas(InfoStandPetView.STATUS_BAR_WIDTH, InfoStandPetView.STATUS_BAR_HEIGTH);
        const context = canvas.getContext('2d');

        if(!context) return null;

        context.fillStyle = toCssColor(InfoStandPetView.STATUS_BAR_BORDER_COLOR);
        context.fillRect(0, 0, InfoStandPetView.STATUS_BAR_WIDTH, InfoStandPetView.STATUS_BAR_HEIGTH);

        context.fillStyle = toCssColor(InfoStandPetView.STATUS_BAR_BG_COLOR);
        context.fillRect(1, 1, InfoStandPetView.STATUS_BAR_WIDTH - 2, InfoStandPetView.STATUS_BAR_HEIGTH - 2);

        context.fillStyle = toCssColor(contentColor);
        context.fillRect(
            1, 1 + InfoStandPetView.STATUS_BAR_HIGHLIGHT_HEIGHT,
            ratio * (InfoStandPetView.STATUS_BAR_WIDTH - 2), InfoStandPetView.STATUS_BAR_HEIGTH - 2 - InfoStandPetView.STATUS_BAR_HIGHLIGHT_HEIGHT
        );

        context.fillStyle = toCssColor(highlightColor);
        context.fillRect(1, 1, ratio * (InfoStandPetView.STATUS_BAR_WIDTH - 2), InfoStandPetView.STATUS_BAR_HIGHLIGHT_HEIGHT);

        return canvas.transferToImageBitmap();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::updateRespectButton()
    private updateRespectButton(): void
    {
        const respectLeft = this._widget.userData.petRespectLeft;

        this._widget.localizations?.registerParameter('infostand.button.petrespect', 'count', respectLeft.toString());
        this.showButton('petrespect', respectLeft > 0);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::showButton()
    // The name is the button's *region* ("petrespect"), not the button inside it ("btn_petrespect").
    private showButton(name: string, visible: boolean): void
    {
        const button = this._buttonsContainer?.getChildByName(name);

        if(!button) return;

        button.visible = visible;
        this.arrangeButtons();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::arrangeButtons()
    // Right-to-left flow: regions pack from the right edge and wrap to a new row when the next one
    // would not fit.
    private arrangeButtons(): void
    {
        if(!this._buttonsContainer) return;

        this._buttonsContainer.width = InfoStandPetView.BUTTONS_MAX_WIDTH;

        const regions: IWindow[] = [];

        this._buttonsContainer.groupChildrenWithTag('CMD_BUTTON_REGION', regions, -1);

        let cursor = InfoStandPetView.BUTTONS_MAX_WIDTH;
        let row = 0;

        for(const region of regions)
        {
            if(!region.visible) continue;

            if(cursor - region.width < 0)
            {
                cursor = InfoStandPetView.BUTTONS_MAX_WIDTH;
                row += InfoStandPetView.BUTTON_HEIGHT + InfoStandPetView.BUTTON_MARGIN;
            }

            region.x = cursor - region.width;
            region.y = row;
            cursor = region.x - InfoStandPetView.BUTTON_MARGIN;
        }

        this._buttonsContainer.height = row + InfoStandPetView.BUTTON_HEIGHT;
        this.updateWindow();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::getSkillLevelIndex()
    private getSkillLevelIndex(level: number, skillTresholds: number[]): number
    {
        let index = 0;

        for(const treshold of skillTresholds)
        {
            if(treshold > 0 && level >= treshold) index++;
        }

        return index;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::getLowerSkillTreshold()
    // Currently only reachable from the deferred PetCommandTool path; ported now so the tool has a
    // complete host to land on rather than leaving a hole in the class.
    private getLowerSkillTreshold(level: number, skillTresholds: number[]): number
    {
        let result = 0;

        for(const treshold of skillTresholds)
        {
            if(treshold > level) break;

            result = treshold;
        }

        return result;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::getUpperSkillTreshold()
    private getUpperSkillTreshold(level: number, skillTresholds: number[]): number
    {
        const lower = this.getLowerSkillTreshold(level, skillTresholds);
        const index = skillTresholds.indexOf(lower);

        return index < skillTresholds.length - 1 ? skillTresholds[index + 1] : lower;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::getBreedLocalizationKey()
    private getBreedLocalizationKey(petType: number, breedId: number): string
    {
        return `pet.breed.${petType}.${breedId}`;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::onButtonResized()
    private onButtonResized = (event: WindowEvent): void =>
    {
        const parent = event.window?.parent;

        if(parent && parent.tags.indexOf('CMD_BUTTON_REGION') > -1) parent.width = event.window.width;
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::onClose()
    private onClose = (): void =>
    {
        this._widget.close();
    };

    // DEVIATION: AS3 also handles buy-food (opens the pet-accessories catalog page) and treat; the
    //   RPG fork removed pet feeding and monsterplants. Move/rotate stay: the buttons are hidden.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetView.as::onButtonClicked()
    private onButtonClicked = (event: WindowMouseEvent): void =>
    {
        let messageType: string | null = null;

        switch((event.target as IWindow | null)?.name)
        {
            case 'btn_move':
                messageType = RoomWidgetFurniActionMessage.MOVE;
                break;
            case 'btn_rotate':
                messageType = RoomWidgetFurniActionMessage.ROTATE;
                break;
            case 'btn_pick':
            case 'btn_kick':
                // AS3 has these as two identical cases — both pick the pet up, and both close the
                // command tool if it is showing this pet. The captions differ, not the action.
                messageType = 'RWUAM_PICKUP_PET';
                this.closeTrainView();
                break;
            case 'btn_train':
                this.openTrainView();
                break;
            case 'btn_petrespect':
                // AS3 decrements optimistically before the server confirms, so the count and the
                // button's own visibility update on click rather than on the response.
                this._widget.userData.petRespectLeft -= 1;
                this.updateRespectButton();
                messageType = ' RWUAM_RESPECT_PET';
                break;
        }

        if(messageType !== null)
        {
            if(messageType === RoomWidgetFurniActionMessage.MOVE || messageType === RoomWidgetFurniActionMessage.ROTATE)
            {
                // Move/rotate address the pet as a room object (category 100 + its room index);
                // everything else addresses it by pet id.
                this._widget.messageListener?.processWidgetMessage(
                    new RoomWidgetFurniActionMessage(messageType, this._widget.petData.roomIndex, 100, -1, null)
                );
            }
            else
            {
                this._widget.messageListener?.processWidgetMessage(
                    new RoomWidgetUserActionMessage(messageType, this._widget.petData.id)
                );
            }
        }

        this.updateWindow();
    };
}
