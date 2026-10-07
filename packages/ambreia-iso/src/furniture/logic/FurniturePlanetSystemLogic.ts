/**
 * FurniturePlanetSystemLogic
 *
 * @see source_as_win63/habbo/room/object/logic/furniture/FurniturePlanetSystemLogic.as
 *
 * Logic for planet system furniture (stores particle system data).
 */
import {FurnitureLogic} from './FurnitureLogic';

export class FurniturePlanetSystemLogic extends FurnitureLogic
{
    override initialize(data: unknown): void
    {
        super.initialize(data);

        if(data === null)
        {
            return;
        }

        const config = data as { planetsystem?: string };

        if(config.planetsystem)
        {
            this.object?.getModelController()?.setString('furniture_planetsystem_data', config.planetsystem);
        }
    }
}
