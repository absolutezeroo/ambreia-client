import {Logger} from '@ambreia/common/utils/Logger';
import {RoomEngineObjectEvent} from '@ambreia/iso/scene/events/RoomEngineObjectEvent';
import {RoomObjectCategoryEnum} from '@ambreia/iso/scene/object/RoomObjectCategoryEnum';
import type {RpgTargetMessage} from '@ambreia/protocol/incoming/rpg/interaction/RpgTargetMessage';
import {RoomSessionEvent} from '../../session/events/RoomSessionEvent';
import type {IRoomSession} from '../../session/IRoomSession';
import type {IGameFeature} from '../GameFeature';
import {WindowBits} from '../../ui/kit/WindowBits';
import type {IHudPanels} from '../hud/IHud';
import {HudTargetClose} from './HudTargetClose';
import {RpgInteractionSession} from './RpgInteractionSession';

const log = Logger.getLogger('habbo.features.interaction');

/** The target frame's portrait for a monster (vortex_hud_target_xml's own). */
const MONSTER_PORTRAIT = 'rpg/ui-icons/rpg_creature_archetypes_giant_ogre_troll_cyclops_monster_icon';

/**
 * The HUD's target frame for an RpgTarget: a player's head (`figure`, from the room's Users), name
 * and `Niv. 6 · Guerrier`; a monster's portrait, translated name (`<id>.name`, M1a §9.1), level and
 * rank (`Niv. 8 · Élite`, M1c: the frame's border too).
 * HP when the combat knows them (`health`, M1a §9.2); no effects on the wire yet.
 */
export function targetUnit(target: RpgTargetMessage, bits: WindowBits, figure: string | null, health: {health: number; maxHealth: number} | null = null): IHudPanels['target']
{
    if(target.objectId === 0) return null;

    const level = bits.text('vortex.ui.level.short', 'level', String(target.level));
    const className = target.classId === '' ? '' : bits.contentName(`vortex.${target.classId}`, target.classId);
    const monster = target.kind === 'monster';
    const rank = target.rank === 'elite' ? bits.text('vortex.hud.elite') : target.rank === 'boss' ? bits.text('vortex.hud.boss') : '';
    const info = [level, className, rank].filter(part => part !== '').join(' · ');

    return {
        name: monster ? bits.contentName(`${target.name}.name`, target.name) : target.name,
        portrait: monster ? MONSTER_PORTRAIT : null, figure: monster ? null : figure,
        level: target.level, info, rank: target.rank,
        hp: health?.health ?? null, hpMax: health?.maxHealth ?? null, debuffs: [], cast: null
    };
}

/**
 * The zone's interaction (F3b §7.3): in a zone the decor is frozen and only the objects the server
 * lists answer a click (RoomEngine.setRpgInteractives()); a click on an avatar targets it, a click
 * in the void or Escape clears the target, and the HUD's target frame shows what RpgTarget says.
 */
export const InteractionFeature: IGameFeature = {
    id: 'interaction',
    requires: ['roomEngine', 'hud', 'roomSession', 'input', 'combat'],
    create: ({host, scope}) =>
    {
        const session = new RpgInteractionSession(host.made.combat!.model);
        const on = scope.bind(session.events);

        host.made.interaction = session;

        const engine = host.made.roomEngine;
        const hud = host.made.hud;
        /** The room the player is in: its Users give the target's figure. */
        let room: IRoomSession | null = null;

        on('interactives', message =>
        {
            log.debug(`${message.objects.length} usable object(s) in this zone`);
            engine?.setRpgInteractives(new Map(message.objects.map(object => [object.objectId, object.interaction])));
        });

        on('target', target =>
        {
            engine?.setRpgTarget(target.objectId);
            const figure = room?.userDataManager.getUserDataByIndex(target.objectId)?.figure ?? null;

            hud?.update({target: targetUnit(target, new WindowBits(host.made.localization), figure, host.made.combat?.model.vitalsOf(target.objectId) ?? null)});
        });

        // The HUD frame's close button clears the frame alone: ask the server to clear the target too.
        const close = new HudTargetClose(objectId => session.select(objectId));

        scope.bind(hud?.events)('changed', value => close.changed(value.target));

        const engineOn = scope.bind(engine?.events);

        engineOn(RoomEngineObjectEvent.REOE_SELECTED, (event: RoomEngineObjectEvent) =>
        {
            if(event.category === RoomObjectCategoryEnum.OBJECT_CATEGORY_USER) session.select(event.objectId);
        });
        engineOn(RoomEngineObjectEvent.REOE_DESELECTED, () => session.select(0));

        // Escape clears the target, when there is one; what the features after this push (a tile
        // pick, a cast) goes first.
        scope.add(host.made.input!.onEscape('interaction', () =>
        {
            if(session.targetId === 0) return false;

            session.select(0);

            return true;
        }));

        const sessionOn = scope.bind(host.made.roomSession?.sessionEvents);

        sessionOn(RoomSessionEvent.RSE_STARTED, (event: RoomSessionEvent) => room = event.session);
        sessionOn(RoomSessionEvent.RSE_ENDED, () =>
        {
            room = null;
            engine?.setRpgInteractives(null);
            engine?.setRpgTarget(0);
            hud?.update({target: null});
        });

        scope.own(session).hook('interaction', {session});

        return null;
    },
    afterAttach: async (_product, {host}) =>
    {
        // The communication manager builds its connection in initComponent(), a microtask after its attach.
        await Promise.resolve();

        const connection = host.made.communication?.connection ?? null;

        if(connection) host.made.interaction?.install(connection);
        else log.warn('no game connection to serve the interaction on — clicks in a zone will use Habbo\'s rules');
    }
};
