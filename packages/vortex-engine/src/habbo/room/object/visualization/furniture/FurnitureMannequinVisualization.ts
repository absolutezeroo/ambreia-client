/**
 * FurnitureMannequinVisualization
 *
 * Draws an avatar figure into the mannequin furni's `avatar_image` sprite. The figure comes off the
 * object model (`furniture_mannequin_figure` / `_gender`), is rendered through the avatar render
 * manager, and the resulting texture is registered in the visualization's own asset collection
 * under a per-object name so the sprite layer can resolve it like any other asset.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureMannequinVisualization.as
 */
import type {IRoomObjectVisualizationData} from '@room/object/visualization/IRoomObjectVisualizationData';
import type {RoomObjectSpriteData} from '@ambreia/common/graphics/RoomObjectSpriteData';
import type {IAvatarImage} from '@habbo/avatar/IAvatarImage';
import type {IAvatarImageListener} from '@habbo/avatar/IAvatarImageListener';
import {RoomObjectVariableEnum} from '@habbo/room/object/RoomObjectVariableEnum';
import {AvatarFurnitureVisualizationData} from './AvatarFurnitureVisualizationData';
import {FurnitureVisualization} from './FurnitureVisualization';

export class FurnitureMannequinVisualization extends FurnitureVisualization implements IAvatarImageListener
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureMannequinVisualization.as::AVATAR_IMAGE_SPRITE_TAG
    private static readonly AVATAR_IMAGE_SPRITE_TAG: string = 'avatar_image';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureMannequinVisualization.as::_customPlaceholders
    private static _customPlaceholders: Map<number, IAvatarImage> | null = null;

    // Name recovered from PRODUCTION's `private static var _instanceCount:int` (l.16); the primary
    //   tree obfuscates it to `_SafeStr_6498`.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureMannequinVisualization.as::_instanceCount
    private static _instanceCount: number = 0;

    // AS3 declares this `private const` on the instance, not on the class; static here because the
    //   value is fixed and the port's naming rule reserves UPPER_SNAKE for static members.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureMannequinVisualization.as::MANNEQUIN_BODY
    private static readonly MANNEQUIN_BODY: string = 'hd-99999-99998';

    // Names recovered from PRODUCTION (l.20-26), which declares all six unobfuscated; the primary
    //   tree has `_SafeStr_5551`/`_SafeStr_4645`/`_SafeStr_4751`/`_SafeStr_5769` for four of them.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureMannequinVisualization.as::_figure
    private _figure: string | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureMannequinVisualization.as::_gender
    private _gender: string | null = null;
    // AS3 names this `_scale` (PRODUCTION l.22) and it is NOT the base class's scale: it records the
    //   scale the avatar texture was last built at, and `updateObject()` compares it *after*
    //   `super.updateObject()` has already written the base's own. They are two fields in AS3 too;
    //   the port's base happens to hold the readable name, so this one is renamed. Reusing the
    //   base's would make the comparison permanently false and the figure would never be
    //   re-rendered on a zoom change. Obfuscated as `_SafeStr_4751` in the primary tree.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureMannequinVisualization.as::_scale
    private _avatarScale: number = 0;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureMannequinVisualization.as::_needsUpdate
    private _needsUpdate: boolean = false;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureMannequinVisualization.as::_dynamicAssetName
    private _dynamicAssetName: string | null = null;
    // AS3 names this `_data` (PRODUCTION l.25) and keeps it beside the base class's own private
    //   `_data`, which AS3 allows and TypeScript does not — the port's FurnitureVisualization
    //   already declares `private _data`, so redeclaring it here is a compile error. Same field,
    //   forced rename. Obfuscated as `_SafeStr_4556` in the primary tree.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureMannequinVisualization.as::_data
    private _avatarData: AvatarFurnitureVisualizationData | null = null;
    // AS3 names this `_disposed` (PRODUCTION l.26) and the base class already holds that name in
    //   this port, so it is prefixed here — the same forced rename as `_data` above. Obfuscated as
    //   `_SafeStr_5769` in the primary tree.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureMannequinVisualization.as::_disposed
    private _mannequinDisposed: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureMannequinVisualization.as::FurnitureMannequinVisualization()
    constructor()
    {
        super();

        FurnitureMannequinVisualization._instanceCount++;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureMannequinVisualization.as::get disposed()
    get disposed(): boolean
    {
        return this._mannequinDisposed;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureMannequinVisualization.as::initialize()
    override initialize(data: IRoomObjectVisualizationData): boolean
    {
        this._avatarData = (data instanceof AvatarFurnitureVisualizationData) ? data : null;

        super.initialize(data);

        // AS3 returns true unconditionally here, discarding super's answer — a mannequin whose data
        // failed to parse still counts as initialized.
        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureMannequinVisualization.as::updateObject()
    protected override updateObject(scale: number, geometryDirection: number): boolean
    {
        const changed = super.updateObject(scale, geometryDirection);

        if(changed)
        {
            if(this._avatarScale !== scale)
            {
                this._avatarScale = scale;

                this.addAvatarAsset();
            }
        }

        return changed;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureMannequinVisualization.as::updateModel()
    protected override updateModel(scale: number): boolean
    {
        let changed = super.updateModel(scale);

        if(changed)
        {
            const roomObject = this.object;

            if(roomObject !== null)
            {
                const model = roomObject.getModel();

                if(model !== null)
                {
                    const figure = model.getString(RoomObjectVariableEnum.FURNITURE_MANNEQUIN_FIGURE);

                    // AS3 tests `if(_loc2_)`, which is false for the empty string as well as for a
                    // missing key. `getString()` never returns null in this port, so the truthiness
                    // test is the faithful one here and `hasString()` would be wrong: an empty
                    // figure must not be rendered either.
                    if(figure)
                    {
                        this._gender = model.getString(RoomObjectVariableEnum.FURNITURE_MANNEQUIN_GENDER);
                        this._figure = `${figure}.${FurnitureMannequinVisualization.MANNEQUIN_BODY}`;

                        this.addAvatarAsset();
                    }
                }
            }
        }

        if(!changed)
        {
            changed = this._needsUpdate;
        }

        this._needsUpdate = false;

        return changed;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureMannequinVisualization.as::getSpriteList()
    override getSpriteList(): RoomObjectSpriteData[] | null
    {
        if(this._avatarData === null || this._figure === null) return super.getSpriteList();

        const avatar = this._avatarData.getAvatar(this._figure, this._avatarScale, this._gender, this);

        if(avatar === null)
        {
            return super.getSpriteList();
        }

        avatar.setDirection('full', this.direction);

        return avatar.getServerRenderData();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureMannequinVisualization.as::getSpriteAssetName()
    protected override getSpriteAssetName(scale: number, layerIndex: number): string
    {
        const tag = this.getSpriteTag(scale, this.direction, layerIndex);

        if(this._figure !== null && tag === FurnitureMannequinVisualization.AVATAR_IMAGE_SPRITE_TAG && this.isAvatarAssetReady())
        {
            return this.getAvatarAssetName() ?? '';
        }

        return super.getSpriteAssetName(scale, layerIndex);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureMannequinVisualization.as::getSpriteXOffset()
    protected override getSpriteXOffset(scale: number, direction: number, layerIndex: number): number
    {
        const tag = this.getSpriteTag(scale, direction, layerIndex);

        if(tag === FurnitureMannequinVisualization.AVATAR_IMAGE_SPRITE_TAG && this.isAvatarAssetReady())
        {
            return -(this.getSprite(layerIndex)?.width ?? 0) / 2;
        }

        return super.getSpriteXOffset(scale, direction, layerIndex);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureMannequinVisualization.as::getSpriteYOffset()
    protected override getSpriteYOffset(scale: number, direction: number, layerIndex: number): number
    {
        const tag = this.getSpriteTag(scale, direction, layerIndex);

        if(tag === FurnitureMannequinVisualization.AVATAR_IMAGE_SPRITE_TAG && this.isAvatarAssetReady())
        {
            return -(this.getSprite(layerIndex)?.height ?? 0);
        }

        return super.getSpriteYOffset(scale, direction, layerIndex);
    }

    /**
     * Renders the figure and registers it in the asset collection, so the `avatar_image` sprite
     * layer resolves to it. A figure whose assets are still downloading comes back as a
     * placeholder: that one is thrown away and a shared, per-scale mannequin body is drawn instead
     * until `avatarImageReady()` says the real one has arrived.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureMannequinVisualization.as::addAvatarAsset()
    private addAvatarAsset(force: boolean = false): void
    {
        if(this.isAvatarAssetReady() && !force) return;
        if(this._avatarData === null || this._figure === null) return;

        const avatar = this._avatarData.getAvatar(this._figure, this._avatarScale, this._gender, this);

        if(avatar === null) return;

        const assetName = this.getAvatarAssetName();

        if(assetName === null)
        {
            avatar.dispose();

            return;
        }

        if(avatar.isPlaceholder())
        {
            avatar.dispose();

            const placeholder = this.getCustomPlaceholder(this._avatarScale);

            if(placeholder === null) return;

            placeholder.setDirection('full', this.direction);

            const image = placeholder.getImage('full', true);

            if(image !== null) this.assetCollection?.addAsset(assetName, image, true);

            this._needsUpdate = true;

            return;
        }

        avatar.setDirection('full', this.direction);

        if(this._dynamicAssetName !== null)
        {
            this.clearDynamicSpriteAssets();
            this.assetCollection?.disposeAsset(this._dynamicAssetName);
        }

        const image = avatar.getImage('full', true);

        if(image !== null) this.assetCollection?.addAsset(assetName, image, true);

        this._dynamicAssetName = assetName;
        this._needsUpdate = true;

        avatar.dispose();
    }

    /**
     * Detaches the outgoing texture from every sprite still pointing at it, before the asset is
     * disposed. Without this the sprites keep drawing a destroyed texture.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureMannequinVisualization.as::clearDynamicSpriteAssets()
    private clearDynamicSpriteAssets(): void
    {
        let index = 0;

        while(index < this.spriteCount)
        {
            const sprite = this.getSprite(index);

            if(sprite !== null && sprite.assetName === this._dynamicAssetName)
            {
                sprite.texture = null;
            }

            index++;
        }
    }

    /**
     * The bare mannequin body, shared by every mannequin at a given scale and never disposed until
     * the last instance goes.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureMannequinVisualization.as::getCustomPlaceholder()
    private getCustomPlaceholder(scale: number): IAvatarImage | null
    {
        if(this._avatarData === null) return null;

        if(FurnitureMannequinVisualization._customPlaceholders === null)
        {
            FurnitureMannequinVisualization._customPlaceholders = new Map<number, IAvatarImage>();
        }

        let placeholder = FurnitureMannequinVisualization._customPlaceholders.get(scale) ?? null;

        if(placeholder === null)
        {
            placeholder = this._avatarData.getAvatar(FurnitureMannequinVisualization.MANNEQUIN_BODY, scale, null, null);

            if(placeholder === null) return null;

            FurnitureMannequinVisualization._customPlaceholders.set(scale, placeholder);
        }

        return placeholder;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureMannequinVisualization.as::isAvatarAssetReady()
    private isAvatarAssetReady(): boolean
    {
        if(this._figure === null) return false;

        const assetName = this.getAvatarAssetName();

        return assetName !== null && this.getAsset(assetName) !== null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureMannequinVisualization.as::getAvatarAssetName()
    private getAvatarAssetName(): string | null
    {
        const roomObject = this.object;

        if(roomObject === null) return null;

        return `mannequin_${this._figure}_${this._avatarScale}_${this.direction}_${roomObject.getId()}`;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureMannequinVisualization.as::avatarImageReady()
    avatarImageReady(figure: string): void
    {
        if(figure === this._figure)
        {
            this.addAvatarAsset(true);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureMannequinVisualization.as::dispose()
    override dispose(): void
    {
        if(this._mannequinDisposed) return;

        this._avatarData = null;
        this._mannequinDisposed = true;

        if(this._dynamicAssetName !== null && this.assetCollection !== null)
        {
            this.clearDynamicSpriteAssets();
            this.assetCollection.disposeAsset(this._dynamicAssetName);
            this._dynamicAssetName = null;
        }

        super.dispose();

        FurnitureMannequinVisualization._instanceCount--;

        if(FurnitureMannequinVisualization._instanceCount === 0 && FurnitureMannequinVisualization._customPlaceholders !== null)
        {
            for(const placeholder of FurnitureMannequinVisualization._customPlaceholders.values())
            {
                placeholder.dispose();
            }

            FurnitureMannequinVisualization._customPlaceholders = null;
        }
    }
}
