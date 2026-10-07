import {RoomObjectLogicEnum} from '@habbo/room/object/RoomObjectLogicEnum';
import {RoomObjectVisualizationEnum} from '@habbo/room/object/RoomObjectVisualizationEnum';
import {RoomLogic} from '@habbo/room/object/logic/room/RoomLogic';
import {RoomTileCursorLogic} from '@habbo/room/object/logic/room/RoomTileCursorLogic';
import {SelectionArrowLogic} from '@habbo/room/object/logic/room/SelectionArrowLogic';
import {AnimatedFurnitureVisualizationData} from '@habbo/room/object/visualization/furniture/AnimatedFurnitureVisualizationData';
import {FurnitureVisualizationData} from '@habbo/room/object/visualization/furniture/FurnitureVisualizationData';
import {RoomVisualization} from '@habbo/room/object/visualization/room/RoomVisualization';
import {TileCursorVisualization} from '@habbo/room/object/visualization/room/TileCursorVisualization';
import type {IIsoRegistries} from '@room/object/IIsoRegistries';

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
