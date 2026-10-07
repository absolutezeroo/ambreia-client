import {signal, type SignalReader} from '@ambreia/common/reactive/index';
import {EditorEvents, type EditorState} from './EditorState';

/**
 * The editor's events, bridged into revision signals — one per
 * {@link EditorEvents} member. Reading a revision inside a computed or effect
 * subscribes it; the corresponding event pulses it.
 *
 * One instance per {@link EditorState}, shared by every panel (`signalsOf`
 * memoises). The subscriptions live as long as the state does — glaze has one
 * state per session, so there is deliberately no teardown path.
 */
export class EditorSignals
{
    public readonly layoutRev: SignalReader<number>;
    public readonly selectionRev: SignalReader<number>;
    public readonly treeRev: SignalReader<number>;
    public readonly geometryRev: SignalReader<number>;
    public readonly debugRev: SignalReader<number>;
    public readonly viewRev: SignalReader<number>;

    constructor(state: EditorState)
    {
        const bridge = (eventType: string): SignalReader<number> =>
        {
            const [read, write] = signal(0);
            let n = 0;

            state.events.on(eventType, () => write(++n));

            return read;
        };

        this.layoutRev = bridge(EditorEvents.LAYOUT_CHANGED);
        this.selectionRev = bridge(EditorEvents.SELECTION_CHANGED);
        this.treeRev = bridge(EditorEvents.TREE_CHANGED);
        this.geometryRev = bridge(EditorEvents.GEOMETRY_CHANGED);
        this.debugRev = bridge(EditorEvents.DEBUG_CHANGED);
        this.viewRev = bridge(EditorEvents.VIEW_CHANGED);
    }
}

const INSTANCES: WeakMap<EditorState, EditorSignals> = new WeakMap();

/** The shared {@link EditorSignals} for a state, created on first use. */
export function signalsOf(state: EditorState): EditorSignals
{
    let instance = INSTANCES.get(state);

    if(!instance)
    {
        instance = new EditorSignals(state);
        INSTANCES.set(state, instance);
    }

    return instance;
}
