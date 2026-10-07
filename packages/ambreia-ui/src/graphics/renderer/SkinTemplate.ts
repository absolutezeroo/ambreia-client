import type {SkinTemplateEntity} from './SkinTemplateEntity';

/**
 * Collection of template entities with a reference to the spritesheet atlas.
 *
 * Each template represents a set of source regions in a spritesheet.
 * The atlas is the ImageBitmap of the spritesheet PNG.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/graphics/renderer/SkinTemplate.as
 */
export class SkinTemplate 
{
    private _entityByName: Map<string, SkinTemplateEntity> = new Map();

    constructor(name: string, atlas: ImageBitmap | null) 
    {
        this._name = name;
        this._atlas = atlas;
    }

    // AS3: .../src/com/sulake/core/window/graphics/renderer/SkinTemplate.as::_name
    private _name: string;

    // AS3: .../src/com/sulake/core/window/graphics/renderer/SkinTemplate.as::get name()
    public get name(): string 
    {
        return this._name;
    }

    private _atlas: ImageBitmap | null;

    public get atlas(): ImageBitmap | null 
    {
        return this._atlas;
    }

    private _entities: SkinTemplateEntity[] = [];

    public get entities(): readonly SkinTemplateEntity[] 
    {
        return this._entities;
    }

    public get numEntities(): number 
    {
        return this._entities.length;
    }

    /**
     * Adds a template entity.
     *
     * @param entity - The entity to add
     */
    public addEntity(entity: SkinTemplateEntity): void 
    {
        this._entities.push(entity);
        this._entityByName.set(entity.name, entity);
    }

    /**
     * Returns the entity with the given name.
     *
     * @param name - The entity name
     * @returns The template entity, or null
     */
    public getEntityByName(name: string): SkinTemplateEntity | null 
    {
        return this._entityByName.get(name) ?? null;
    }

    /**
     * Returns the entity at the given index.
     *
     * @param index - The entity index
     * @returns The template entity
     */
    public getEntityAt(index: number): SkinTemplateEntity 
    {
        return this._entities[index];
    }
}
