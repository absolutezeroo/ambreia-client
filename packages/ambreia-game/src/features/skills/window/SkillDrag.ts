import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IHabboWindowManager} from '../../../window/IHabboWindowManager';
import type {WindowBits} from '../../../ui/kit/WindowBits';
import type {SkillDraw} from './SkillDraw';

/** A press becomes a drag past this many pixels. */
const DRAG_START = 4;

/** A learned skill pressed: dragged once the pointer moved, its icon following the pointer over everything, then dropped. */
export class SkillDrag
{
    private _drag: {skillId: string; x: number; y: number; ghost: IWindowContainer | null} | null = null;

    private readonly _onPointerMove = (event: PointerEvent): void => this.move(event.clientX, event.clientY);

    /**
     * @param desktop - where the dragged icon is drawn (the window's parent)
     * @param onDrop - the skill was dropped at this desktop point
     */
    constructor(
        private readonly _windows: IHabboWindowManager,
        private readonly _bits: WindowBits,
        private readonly _draw: SkillDraw,
        private readonly _desktop: () => IWindowContainer | null,
        private readonly _onDrop: (skillId: string, x: number, y: number) => void
    ) {}

    start(skillId: string, x: number, y: number): void
    {
        this.end();
        this._drag = {skillId, x, y, ghost: null};
        globalThis.addEventListener?.('pointermove', this._onPointerMove);
    }

    /** The release: a drag that moved is dropped there; a press that did not is only a click. */
    release(x: number, y: number): void
    {
        const drag = this._drag;

        this.end();

        if(drag?.ghost) this._onDrop(drag.skillId, x, y);
    }

    end(): void
    {
        globalThis.removeEventListener?.('pointermove', this._onPointerMove);
        this._drag?.ghost?.destroy();
        this._drag = null;
    }

    /** Past DRAG_START the skill's icon follows the pointer, over everything. */
    private move(x: number, y: number): void
    {
        const drag = this._drag;

        if(!drag) return;

        if(!drag.ghost)
        {
            if(Math.abs(x - drag.x) < DRAG_START && Math.abs(y - drag.y) < DRAG_START) return;

            const desktop = this._desktop();
            const ghost = this._windows.buildWidgetLayout('vortex_skill_action_slot_xml') as IWindowContainer | null;

            if(!desktop || !ghost) return;

            this._draw.slot(ghost, drag.skillId, true);
            this._bits.setText(ghost, 'slot_key', '');
            ghost.blend = 0.85;
            desktop.addChild(ghost);
            drag.ghost = ghost;
        }

        drag.ghost.x = Math.round(x - drag.ghost.width / 2);
        drag.ghost.y = Math.round(y - drag.ghost.width / 2);
    }
}
