import type {SkinLayoutEntity} from './SkinLayoutEntity';

/**
 * Collection of layout entities defining the skin layout.
 *
 * Calculates the base width and height from its entities, which are used
 * by the renderer to compute the delta between target size and layout size.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinLayout.as
 */
export class SkinLayout 
{
    constructor(name: string, transparent: boolean, blendMode: string) 
    {
        this._name = name;
        this._transparent = transparent;
        this._blendMode = blendMode;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinLayout.as::_name
    private _name: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinLayout.as::get name()
    public get name(): string 
    {
        return this._name;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/graphics/renderer/SkinLayout.as::_transparent
    private _transparent: boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinLayout.as::get transparent()
    public get transparent(): boolean 
    {
        return this._transparent;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinLayout.as::_blendMode
    private _blendMode: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinLayout.as::get blendMode()
    public get blendMode(): string 
    {
        return this._blendMode;
    }

    private _entities: SkinLayoutEntity[] = [];

    public get entities(): readonly SkinLayoutEntity[] 
    {
        return this._entities;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinLayout.as::_width
    private _width: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinLayout.as::get width()
    public get width(): number 
    {
        return this._width;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/graphics/renderer/SkinLayout.as::_height
    private _height: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinLayout.as::get height()
    public get height(): number 
    {
        return this._height;
    }

    // `ChildEntityArray` only inherits this; it is declared on its base, whose class name is
    // obfuscated in every tree (`_SafeCls_4490`, `implements _SafeCls_2083`).
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/_SafeCls_4490.as::get numChildren()
    public get numEntities(): number 
    {
        return this._entities.length;
    }

    /**
     * Adds a layout entity and recalculates dimensions.
     *
     * @param entity - The entity to add
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinLayout.as::addChild()
    // AS3 SkinLayout extends ChildEntityArray and overrides addChild/addChildAt;
    // this port owns a plain array, so the child API is named after what it holds.
    public addEntity(entity: SkinLayoutEntity): void 
    {
        this._entities.push(entity);

        const right = entity.region.x + entity.region.width;
        const bottom = entity.region.y + entity.region.height;

        if(right > this._width) this._width = right;
        if(bottom > this._height) this._height = bottom;
    }

    /**
     * Returns the entity at the given index.
     *
     * @param index - The entity index
     * @returns The layout entity
     */
    // Declared on `ChildEntityArray`'s obfuscated base, as with numEntities above.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/_SafeCls_4490.as::getChildAt()
    public getEntityAt(index: number): SkinLayoutEntity 
    {
        return this._entities[index];
    }

    /**
     * Returns the entity with the given name.
     *
     * @param name - The entity name
     * @returns The layout entity, or null
     */
    // Declared on `ChildEntityArray`'s obfuscated base, as with numEntities above.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/_SafeCls_4490.as::getChildByName()
    public getEntityByName(name: string): SkinLayoutEntity | null
    {
        for(const entity of this._entities)
        {
            if(entity.name === name) return entity;
        }

        return null;
    }

    /**
     * Returns the first entity carrying the given id.
     *
     * @param id - The entity id
     * @returns The layout entity, or null
     */
    // Declared on `ChildEntityArray`'s obfuscated base, as with numEntities above.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/_SafeCls_4490.as::getChildByID()
    public getEntityByID(id: number): SkinLayoutEntity | null
    {
        for(const entity of this._entities)
        {
            if(entity.id === id) return entity;
        }

        return null;
    }

    /**
     * Returns the index of an entity, or -1 when it is not in this layout.
     *
     * @param entity - The entity to look up
     * @returns The index, or -1
     */
    // Declared on `ChildEntityArray`'s obfuscated base, as with numEntities above.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/_SafeCls_4490.as::getChildIndex()
    public getEntityIndex(entity: SkinLayoutEntity): number
    {
        return this._entities.indexOf(entity);
    }

    /**
     * Appends every entity carrying `id` to `out`.
     *
     * Ids are not unique — `getEntityByID` returns the first, this returns all of them.
     *
     * @param id - The entity id
     * @param out - Array the matches are pushed onto
     * @returns How many were appended
     */
    // Declared on `ChildEntityArray`'s obfuscated base, as with numEntities above.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/_SafeCls_4490.as::groupChildrenWithID()
    public groupEntitiesWithID(id: number, out: SkinLayoutEntity[]): number
    {
        let count = 0;

        for(const entity of this._entities)
        {
            if(entity.id === id)
            {
                out.push(entity);
                count++;
            }
        }

        return count;
    }

    /**
     * Whether no entity stretches horizontally, so the layout cannot be
     * widened.
     *
     * An empty layout is *not* fixed — AS3 returns false before the loop, and
     * the distinction matters: an empty layout is unconstrained, not rigid.
     *
     * @returns `true` when every entity has `scaleH === 0`
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinLayout.as::isFixedWidth()
    public isFixedWidth(): boolean
    {
        if(this._entities.length === 0)
        {
            return false;
        }

        for(const entity of this._entities)
        {
            if(entity.scaleH !== 0)
            {
                return false;
            }
        }

        return true;
    }

    /**
     * Whether no entity stretches vertically, so the layout cannot be
     * heightened.
     *
     * @returns `true` when every entity has `scaleV === 0`
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinLayout.as::isFixedHeight()
    public isFixedHeight(): boolean
    {
        if(this._entities.length === 0)
        {
            return false;
        }

        for(const entity of this._entities)
        {
            if(entity.scaleV !== 0)
            {
                return false;
            }
        }

        return true;
    }

    /**
     * Recomputes the layout width as the rightmost entity edge.
     *
     * @returns The widest right edge across every entity
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinLayout.as::calculateWidth()
    public calculateWidth(): number
    {
        let width = 0;

        for(const entity of this._entities)
        {
            const right = entity.region.x + entity.region.width;

            if(right > width) width = right;
        }

        return width;
    }

    /**
     * Recomputes the layout height as the lowest entity edge.
     *
     * @returns The lowest bottom edge across every entity
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinLayout.as::calculateHeight()
    public calculateHeight(): number
    {
        let height = 0;

        for(const entity of this._entities)
        {
            const bottom = entity.region.y + entity.region.height;

            if(bottom > height) height = bottom;
        }

        return height;
    }

    /**
     * Copies a named entity's region into `out`.
     *
     * @param name - The entity name
     * @param out - Rectangle to fill with the entity's region
     * @throws When no entity carries that name — as AS3 does, rather than
     *   leaving the caller with an unwritten rectangle it would read as (0,0).
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinLayout.as::getDefaultRegion()
    public getDefaultRegion(name: string, out: { x: number; y: number; width: number; height: number }): void
    {
        const entity = this.getEntityByName(name);

        if(entity === null)
        {
            throw new Error(`Entity not found: ${name}!`);
        }

        out.x = entity.region.x;
        out.y = entity.region.y;
        out.width = entity.region.width;
        out.height = entity.region.height;
    }

    /**
     * Removes an entity, then recomputes width/height from what is left.
     *
     * @param entity - The entity to remove
     * @returns The removed entity, or null when it was not in this layout
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinLayout.as::removeChild()
    public removeEntity(entity: SkinLayoutEntity): SkinLayoutEntity | null
    {
        const index = this._entities.indexOf(entity);

        if(index < 0) return null;

        return this.removeEntityAt(index);
    }

    /**
     * Removes the entity at `index`, then recomputes width/height.
     *
     * @param index - The entity index
     * @returns The removed entity, or null when the index is out of range
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinLayout.as::removeChildAt()
    public removeEntityAt(index: number): SkinLayoutEntity | null
    {
        if(index < 0 || index >= this._entities.length) return null;

        const [removed] = this._entities.splice(index, 1);

        // AS3 recomputes both from scratch rather than shrinking them: an entity
        // that was not the widest leaves the dimensions untouched.
        this._width = this.calculateWidth();
        this._height = this.calculateHeight();

        return removed;
    }

    /**
     * Fills `out` with the union of every entity region.
     *
     * Ported as AS3 wrote it, degenerate result included: it seeds the rectangle
     * at x/y = 0xFFFFFFFF with width/height 0, and `Rectangle.left`/`top` in Flash
     * move x/y while holding right/bottom — so right/bottom stay at 0xFFFFFFFF and
     * only the top-left corner is ever real. Nothing calls it, in AS3 either
     * (SkinLayout.as is its only occurrence in the whole tree), which is why the
     * bug survived; it is here so the member is not silently missing.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinLayout.as::calculateActualRect()
    public calculateActualRect(out: { x: number; y: number; width: number; height: number }): void
    {
        out.x = 4294967295;
        out.y = 4294967295;
        out.width = 0;
        out.height = 0;

        for(const entity of this._entities)
        {
            const region = entity.region;
            const right = out.x + out.width;
            const bottom = out.y + out.height;

            if(region.x < out.x)
            {
                // Flash: `left` setter is `width += x - value; x = value`.
                out.width = right - region.x;
                out.x = region.x;
            }

            if(region.y < out.y)
            {
                out.height = bottom - region.y;
                out.y = region.y;
            }

            if(region.x + region.width > out.x + out.width)
            {
                out.width = region.x + region.width - out.x;
            }

            if(region.y + region.height > out.y + out.height)
            {
                out.height = region.y + region.height - out.y;
            }
        }
    }

    /**
     * Drains and disposes every entity.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinLayout.as::dispose()
    public dispose(): void
    {
        while(this._entities.length > 0)
        {
            this.removeEntityAt(0)?.dispose();
        }
    }
}
