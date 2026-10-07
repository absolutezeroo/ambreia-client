import {RoomObjectLogicEnum} from './object/RoomObjectLogicEnum';
import {RoomObjectVisualizationEnum} from './object/RoomObjectVisualizationEnum';
import {RoomLogic} from './object/logic/room/RoomLogic';
import {RoomTileCursorLogic} from './object/logic/room/RoomTileCursorLogic';
import {SelectionArrowLogic} from './object/logic/room/SelectionArrowLogic';
import {AnimatedFurnitureVisualizationData} from '../furniture/visualization/AnimatedFurnitureVisualizationData';
import {FurnitureVisualizationData} from '../furniture/visualization/FurnitureVisualizationData';
import {RoomVisualization} from './object/visualization/room/RoomVisualization';
import {TileCursorVisualization} from './object/visualization/room/TileCursorVisualization';
import type {IIsoRegistries} from '../object/IIsoRegistries';

/**
 * The room itself: floor, walls and their planes, the tile cursor, the selection arrow, and the
 * visualization data every sprite-based object falls back on.
 */
export function registerScene(registries: IIsoRegistries): void
{
    registries.logics.register(RoomObjectLogicEnum.ROOM_TILE_CURSOR, () => new RoomTileCursorLogic());
    registries.logics.register(RoomObjectLogicEnum.SELECTION_ARROW, () => new SelectionArrowLogic());
    registries.logics.register(RoomObjectLogicEnum.ROOM, () => new RoomLogic());
    // Room
    registries.visualizations.register(RoomObjectVisualizationEnum.ROOM, () => new RoomVisualization());
    // Tile cursor
    registries.visualizations.register(RoomObjectVisualizationEnum.TILE_CURSOR, () => new TileCursorVisualization());
    registries.visualizations.setDefaultData(() => new FurnitureVisualizationData());
    registries.visualizations.registerData('tile_cursor', () => new AnimatedFurnitureVisualizationData());
}
