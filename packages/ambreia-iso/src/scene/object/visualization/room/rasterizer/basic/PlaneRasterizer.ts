/**
 * PlaneRasterizer
 *
 * Based on AS3: com.sulake.habbo.room.object.visualization.room.rasterizer.basic.PlaneRasterizer
 *
 * Base class for floor/wall/landscape rasterizers. Handles parsing textures,
 * materials, and plane visualizations from Nitro bundle JSON data.
 */
import type {IVector3d} from '../../../../../../utils/IVector3d';
import {Vector3d} from '../../../../../../utils/Vector3d';
import {RoomGeometry} from '../../../../../../utils/RoomGeometry';
import type {IRoomGeometry} from '../../../../../../utils/IRoomGeometry';
import type {IPlaneRasterizer} from '../IPlaneRasterizer';
import type {PlaneBitmapData} from '../../utils/PlaneBitmapData';
import {PlaneTexture} from './PlaneTexture';
import {PlaneMaterial} from './PlaneMaterial';
import {PlaneMaterialCell} from './PlaneMaterialCell';
import {PlaneMaterialCellColumn} from './PlaneMaterialCellColumn';
import {PlaneMaterialCellMatrix} from './PlaneMaterialCellMatrix';
import type {Plane} from './Plane';
import type {
    IAssetPlaneMaterial,
    IAssetPlaneMaterialCell,
    IAssetPlaneMaterialCellColumn,
    IAssetPlaneTexture,
    IAssetPlaneVisualization,
    IAssetPlaneVisualizationData,
    IAssetPlaneVisualizationLayer,
} from './PlaneRasterizerTypes';

export class PlaneRasterizer implements IPlaneRasterizer
{
    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneRasterizer.as::DEFAULT_TYPE
    protected static readonly DEFAULT_TYPE: string = 'default';

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneRasterizer.as::_textures
    private _textures: Map<string, PlaneTexture> = new Map();
    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneRasterizer.as::_materials
    private _materials: Map<string, PlaneMaterial> = new Map();
    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneRasterizer.as::_planes
    private _planes: Map<string, Plane> = new Map();
    private _geometryCache: Map<string, IRoomGeometry> = new Map();
    private _assetTextures: Map<string, HTMLCanvasElement> | null = null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneRasterizer.as::_data
    private _data: IAssetPlaneVisualizationData | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneRasterizer.as::get assetCollection()
    protected get assetCollection(): Map<string, HTMLCanvasElement> | null
    {
        return this._assetTextures;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneRasterizer.as::get data()
    protected get data(): IAssetPlaneVisualizationData | null
    {
        return this._data;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneRasterizer.as::initializeDimensions()
    initializeDimensions(_width: number, _height: number): boolean
    {
        return true;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneRasterizer.as::dispose()
    dispose(): void
    {
        for(const plane of this._planes.values())
        {
            if(plane !== null) plane.dispose();
        }
        this._planes.clear();

        this.resetMaterials();
        this.resetTextures();

        for(const geo of this._geometryCache.values())
        {
            if(geo !== null && 'dispose' in geo)
            {
                (geo as RoomGeometry).dispose();
            }
        }
        this._geometryCache.clear();

        this._data = null;
        this._assetTextures = null;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneRasterizer.as::clearCache()
    clearCache(): void
    {
        for(const plane of this._planes.values())
        {
            if(plane !== null) plane.clearCache();
        }
        for(const material of this._materials.values())
        {
            if(material !== null) material.clearCache();
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneRasterizer.as::initialize()
    initialize(data: IAssetPlaneVisualizationData): void
    {
        this._data = data;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneRasterizer.as::reinitialize()
    reinitialize(): void
    {
        this.resetTextures();
        this.resetMaterials();
        this.initializeAll();
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneRasterizer.as::initializeAssetCollection()
    initializeAssetCollection(textures: Map<string, HTMLCanvasElement>): void
    {
        if(this._data === null) return;
        this._assetTextures = textures;
        this.initializeAll();
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneRasterizer.as::render()
    render(
        _canvas: HTMLCanvasElement | null,
        _id: string,
        _leftLen: number,
        _rightLen: number,
        _scale: number,
        _normal: IVector3d,
        _hasTexture: boolean,
        _offsetU: number = 0,
        _offsetV: number = 0,
        _maxU: number = 0,
        _maxV: number = 0,
        _time: number = 0
    ): PlaneBitmapData | null
    {
        return null;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneRasterizer.as::getTextureIdentifier()
    getTextureIdentifier(scale: number, _normal: IVector3d): string
    {
        return String(scale);
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneRasterizer.as::getLayers()
    getLayers(id: string): (unknown | null)[]
    {
        let plane = this.getPlane(id);
        if(plane === null)
        {
            plane = this.getPlane('default');
        }
        if(plane !== null)
        {
            return plane.getLayers();
        }
        return [];
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneRasterizer.as::getTexture()
    protected getTexture(id: string): PlaneTexture | null
    {
        return this._textures.get(id) ?? null;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneRasterizer.as::getMaterial()
    protected getMaterial(id: string): PlaneMaterial | null
    {
        return this._materials.get(id) ?? null;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneRasterizer.as::getPlane()
    protected getPlane(id: string): Plane | null
    {
        return this._planes.get(id) ?? null;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneRasterizer.as::addPlane()
    protected addPlane(id: string, plane: Plane): boolean
    {
        if(plane === null) return false;
        if(this._planes.has(id)) return false;
        this._planes.set(id, plane);
        return true;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneRasterizer.as::initializePlanes()
    protected initializePlanes(): void
    {
        // Override in subclasses
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneRasterizer.as::getGeometry()
    protected getGeometry(scale: number, horizontalAngle: number, verticalAngle: number): IRoomGeometry
    {
        horizontalAngle = Math.abs(horizontalAngle);
        if(horizontalAngle > 90) horizontalAngle = 90;
        verticalAngle = Math.abs(verticalAngle);
        if(verticalAngle > 90) verticalAngle = 90;

        const key = `${scale}_${Math.round(horizontalAngle)}_${Math.round(verticalAngle)}`;
        let geo = this._geometryCache.get(key) ?? null;

        if(geo === null)
        {
            geo = new RoomGeometry(scale, new Vector3d(horizontalAngle, verticalAngle), new Vector3d(-10, 0, 0));
            this._geometryCache.set(key, geo);
        }

        return geo;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneRasterizer.as::parseVisualizations()
    protected parseVisualizations(plane: Plane, visualizations: IAssetPlaneVisualization[]): void
    {
        if(plane === null || visualizations === null) return;

        for(const visData of visualizations)
        {
            if(visData.size === undefined) continue;

            const size = visData.size;
            const horizontalAngle = visData.horizontalAngle ?? 45;
            const verticalAngle = visData.verticalAngle ?? 30;
            const layers = visData.allLayers ?? [];

            const vis = plane.createPlaneVisualization(size, layers.length, this.getGeometry(size, horizontalAngle, verticalAngle));

            if(vis !== null)
            {
                for(let layerIndex = 0; layerIndex < layers.length; layerIndex++)
                {
                    const layerData = layers[layerIndex] as IAssetPlaneVisualizationLayer;
                    let material: PlaneMaterial | null = null;
                    let align = 1; // ALIGN_TOP

                    if(layerData.materialId !== undefined)
                    {
                        material = this.getMaterial(layerData.materialId);
                    }

                    const offset = layerData.offset ?? 0;
                    const color = layerData.color ?? 0xFFFFFF;

                    if(layerData.align === 'bottom')
                    {
                        align = 2;
                    }
                    else if(layerData.align === 'top')
                    {
                        align = 1;
                    }

                    vis.setLayer(layerIndex, material, color, align, offset);
                }
            }
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneRasterizer.as::resetMaterials()
    private resetMaterials(): void
    {
        for(const material of this._materials.values())
        {
            if(material !== null) material.dispose();
        }
        this._materials.clear();
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneRasterizer.as::resetTextures()
    private resetTextures(): void
    {
        for(const texture of this._textures.values())
        {
            if(texture !== null) texture.dispose();
        }
        this._textures.clear();
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneRasterizer.as::initializeAll()
    private initializeAll(): void
    {
        if(this._data === null) return;
        this.initializeTexturesAndMaterials();
        this.initializePlanes();
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneRasterizer.as::initializeTexturesAndMaterials()
    private initializeTexturesAndMaterials(): void
    {
        if(this._data === null) return;

        if(this._data.textures)
        {
            this.parseTextures(this._data.textures);
        }

        if(this._data.materials)
        {
            this.parsePlaneMaterials(this._data.materials);
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneRasterizer.as::parseTextures()
    private parseTextures(textures: IAssetPlaneTexture[]): void
    {
        if(textures === null || this._assetTextures === null) return;

        for(const textureData of textures)
        {
            if(textureData.id === undefined) continue;

            const id = textureData.id;
            if(this._textures.has(id)) continue;

            const planeTexture = new PlaneTexture();
            const bitmaps = textureData.bitmaps ?? [];

            for(const bitmapData of bitmaps)
            {
                if(bitmapData.assetName === undefined) continue;

                const normalMinX = bitmapData.normalMinX ?? -1;
                const normalMaxX = bitmapData.normalMaxX ?? 1;
                const normalMinY = bitmapData.normalMinY ?? -1;
                const normalMaxY = bitmapData.normalMaxY ?? 1;

                const assetName = bitmapData.assetName;
                const assetCanvas = this._assetTextures.get(assetName);

                if(assetCanvas !== undefined)
                {
                    planeTexture.addBitmap(assetCanvas, normalMinX, normalMaxX, normalMinY, normalMaxY, assetName);
                }
            }

            this._textures.set(id, planeTexture);
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneRasterizer.as::parsePlaneMaterials()
    private parsePlaneMaterials(materials: IAssetPlaneMaterial[]): void
    {
        if(materials === null) return;

        for(const materialData of materials)
        {
            if(materialData.id === undefined) continue;

            const id = materialData.id;
            const material = new PlaneMaterial();
            const matrices = materialData.matrices ?? [];

            for(const matrixData of matrices)
            {
                const repeatMode = this.parseRepeatMode(matrixData.repeatMode ?? null);
                const align = this.parseAlign(matrixData.align ?? null);
                const normalMinX = matrixData.normalMinX ?? -1;
                const normalMaxX = matrixData.normalMaxX ?? 1;
                const normalMinY = matrixData.normalMinY ?? -1;
                const normalMaxY = matrixData.normalMaxY ?? 1;

                const columns = matrixData.columns ?? [];

                if(columns.length > 0)
                {
                    const matrix = material.addMaterialCellMatrix(
                        columns.length, repeatMode, align,
                        normalMinX, normalMaxX, normalMinY, normalMaxY
                    );

                    for(let colIndex = 0; colIndex < columns.length; colIndex++)
                    {
                        this.parsePlaneMaterialCellColumn(columns[colIndex], matrix, colIndex);
                    }
                }
            }

            this._materials.set(id, material);
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneRasterizer.as::parsePlaneMaterialCellColumn()
    private parsePlaneMaterialCellColumn(
        columnData: IAssetPlaneMaterialCellColumn,
        matrix: PlaneMaterialCellMatrix,
        index: number
    ): void
    {
        if(columnData === null || matrix === null) return;

        const repeatMode = this.parseColumnRepeatMode(columnData.repeatMode ?? null);
        const width = columnData.width ?? 1;
        const cells = this.parsePlaneMaterialCells(columnData.cells ?? []);

        matrix.createColumn(index, width, cells, repeatMode);
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneRasterizer.as::parsePlaneMaterialCells()
    private parsePlaneMaterialCells(cellsData: IAssetPlaneMaterialCell[]): PlaneMaterialCell[] | null
    {
        if(cellsData === null) return null;

        const cells: PlaneMaterialCell[] = [];

        for(const cellData of cellsData)
        {
            const textureId = cellData.textureId;
            const texture = textureId !== undefined ? this.getTexture(textureId) : null;
            const cell = new PlaneMaterialCell(texture, null, null, 0);
            cells.push(cell);
        }

        return cells.length === 0 ? null : cells;
    }

    private parseRepeatMode(mode: string | null): number
    {
        switch(mode)
        {
            case 'borders':
                return PlaneMaterialCellMatrix.REPEAT_MODE_BORDERS;
            case 'center':
                return PlaneMaterialCellMatrix.REPEAT_MODE_CENTER;
            case 'first':
                return PlaneMaterialCellMatrix.REPEAT_MODE_FIRST;
            case 'last':
                return PlaneMaterialCellMatrix.REPEAT_MODE_LAST;
            case 'random':
                return PlaneMaterialCellMatrix.REPEAT_MODE_RANDOM;
            default:
                return PlaneMaterialCellMatrix.REPEAT_MODE_ALL;
        }
    }

    private parseColumnRepeatMode(mode: string | null): number
    {
        switch(mode)
        {
            case 'borders':
                return PlaneMaterialCellColumn.REPEAT_MODE_BORDERS;
            case 'center':
                return PlaneMaterialCellColumn.REPEAT_MODE_CENTER;
            case 'first':
                return PlaneMaterialCellColumn.REPEAT_MODE_FIRST;
            case 'last':
                return PlaneMaterialCellColumn.REPEAT_MODE_LAST;
            case 'none':
                return PlaneMaterialCellColumn.REPEAT_MODE_NONE;
            default:
                return PlaneMaterialCellColumn.REPEAT_MODE_ALL;
        }
    }

    private parseAlign(align: string | null): number
    {
        switch(align)
        {
            case 'bottom':
                return PlaneMaterialCellMatrix.ALIGN_BOTTOM;
            case 'top':
                return PlaneMaterialCellMatrix.ALIGN_TOP;
            default:
                return PlaneMaterialCellMatrix.ALIGN_DEFAULT;
        }
    }
}
