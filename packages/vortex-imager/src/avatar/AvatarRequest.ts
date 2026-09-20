/**
 * Turns a `habbo-imaging/avatarimage` query string into the calls the avatar pipeline takes.
 *
 * The parameter names are Habbo's, because that is what every consumer already sends — the
 * client's own login screen, forums, CMS templates. The values are translated here into
 * `AvatarAction` constants so nothing downstream has to know about the URL shape.
 */
import {AvatarAction} from '@habbo/avatar/enum/AvatarAction';
import {AvatarScaleType} from '@habbo/avatar/enum/AvatarScaleType';

export interface IAvatarActionRequest
{
    /** An `AvatarAction` constant — what `appendAction()` is called with. */
    type: string;

    param: string | null;
}

export interface IAvatarRequest
{
    figure: string;

    /** `M`, `F`, or null to leave the figure exactly as given. */
    gender: string | null;

    /** `AvatarScaleType` — which asset set to composite from. */
    scale: string;

    /**
	 * Resize factor applied to the finished image. Above 1 it magnifies with nearest-neighbour;
	 * below 1 it downsamples smoothly (see `render/encode.ts`).
	 */
    zoom: number;

    direction: number;
    headDirection: number;
    headOnly: boolean;

    /** Trim the transparent margin off the avatar canvas. */
    cropped: boolean;

    /** Animation frame to advance to; 0 renders the resting frame. */
    frame: number;

    /** An `AvatarAction.POSTURE_*` constant. */
    posture: string;

    /** Everything that is not the posture, already translated to engine action types. */
    actions: IAvatarActionRequest[];

    /**
	 * Effect id, or 0. Kept out of {@link actions} as well as in it because the render has to
	 * wait for the effect's library before it can composite.
	 */
    effectId: number;

    /**
	 * Which part of the finished avatar to hand back.
	 *
	 * `body` is the avatar itself, effect sprites included — every existing route. The others
	 * answer "what does this thing look like on its own", which the avatar cannot: an
	 * effect's own sprites without the figure wearing them, and the object in the avatar's
	 * hand without the hand. Both still need the whole pipeline to run — a handitem is a body
	 * part of the figure, and an effect's sprites are resolved against its actions — so this
	 * only changes what is composited at the end.
	 *
	 * `clothing` composites exactly like `body` — the figure *is* the garment, because nothing
	 * filled in the rest of it. It is a distinct value only so an unknown part can be answered
	 * as one; see `AvatarRenderService.render()`.
	 */
    part: AvatarPart;
}

export type AvatarPart = 'body' | 'clothing' | 'effect' | 'hand';

/**
 * `size=` → which asset scale to composite from, and how the finished image is resized.
 *
 * Every size composites at `AvatarScaleType.LARGE`, including the small one, and that is a
 * deliberate choice rather than an oversight:
 *
 * - `AvatarScaleType.SMALL` (`sh`) cannot work here. `AvatarImageCache.buildAssetName()` asks
 *   for `sh_*` assets, and this hotel's asset build has none — `hh_human_body.nitro` holds 244
 *   assets, all `h_*`. Every part misses, and the avatar comes back fully transparent with no
 *   warning logged.
 * - `AvatarScaleType.LARGE_TO_SMALL` (`h_50`) is the mode meant for that case: look up large
 *   assets, draw into the small canvas. But the engine's port of it never halves the parts, so
 *   `h`-sized parts get positioned against a 45x72 canvas (`canvasOffset` = height − 8 = 64
 *   against the 114 they were drawn for) and land almost entirely outside it. It is an open
 *   engine-side gap, not something to work around inside the engine from here.
 *
 * So `s` renders at full scale and the *image* is halved, which is what `h_50` means anyway —
 * "render large, downsample" — just applied one step later.
 */
const SIZE_MAP: Record<string, { scale: string; zoom: number }> = {
    s: {scale: AvatarScaleType.LARGE, zoom: 0.5},
    m: {scale: AvatarScaleType.LARGE, zoom: 1},
    l: {scale: AvatarScaleType.LARGE, zoom: 2},
    b: {scale: AvatarScaleType.LARGE, zoom: 3}
};

/** `action=` tokens that select a posture. */
const POSTURE_MAP: Record<string, string> = {
    std: AvatarAction.POSTURE_STAND,
    sit: AvatarAction.POSTURE_SIT,
    lay: AvatarAction.POSTURE_LAY,
    wlk: AvatarAction.POSTURE_WALK,
    mv: AvatarAction.POSTURE_WALK,
    walk: AvatarAction.POSTURE_WALK,
    swim: AvatarAction.POSTURE_SWIM,
    float: AvatarAction.POSTURE_FLOAT
};

/**
 * `action=` tokens that are their own action type.
 *
 * `AvatarImage.appendAction()` takes the expression's *own* constant as the action type —
 * there is no generic "expression" action to pass a name to, despite `AvatarAction.EXPRESSION`
 * existing. Passing that constant instead silently matches no case and the expression is
 * dropped.
 */
const EXPRESSION_MAP: Record<string, string> = {
    wav: AvatarAction.EXPRESSION_WAVE,
    wave: AvatarAction.EXPRESSION_WAVE,
    respect: AvatarAction.EXPRESSION_RESPECT,
    blow: AvatarAction.EXPRESSION_BLOW_A_KISS,
    laugh: AvatarAction.EXPRESSION_LAUGH,
    cry: AvatarAction.EXPRESSION_CRY,
    idle: AvatarAction.EXPRESSION_IDLE,
    sleep: AvatarAction.SLEEP,
    talk: AvatarAction.TALK,
    spk: AvatarAction.TALK
};

/** `action=` tokens that carry an id, e.g. `crr=667`. */
const PARAMETERISED_MAP: Record<string, string> = {
    crr: AvatarAction.CARRY_OBJECT,
    drk: AvatarAction.USE_OBJECT,
    sig: AvatarAction.SIGN,
    dance: AvatarAction.EXPRESSION_JUMP,
    fx: AvatarAction.EFFECT,
    effect: AvatarAction.EFFECT
};

/**
 * The gestures `AvatarImage.appendAction(GESTURE, …)` actually accepts. The pet gestures
 * (`joy`, `crz`, `eyb`, …) share the parameter space but are rejected by the switch, so they
 * are not offered here.
 */
const GESTURES: ReadonlySet<string> = new Set([
    AvatarAction.GESTURE_SMILE,
    AvatarAction.GESTURE_AGGRAVATED,
    AvatarAction.GESTURE_SURPRISED,
    AvatarAction.GESTURE_SAD
]);

/**
 * A parsed query string. `Partial` rather than a plain `Record` because a key that was not in
 * the URL is simply absent — which is also why this is the one place `| undefined` is the right
 * shape: it is the value Fastify hands over, not a nullable of ours.
 */
export type AvatarQuery = Partial<Record<string, string | string[]>>;

export class AvatarRequestError extends Error {}

/**
 * Builds a request from the query string. `figure` must already be resolved — the username
 * lookup happens before this, so this stays pure.
 */
export function parseAvatarRequest(figure: string, query: AvatarQuery): IAvatarRequest
{
    if(figure.trim().length === 0)
    {
        throw new AvatarRequestError('A figure is required');
    }

    const size = (readString(query, 'size') ?? 'm').toLowerCase();
    const sizing = SIZE_MAP[size] ?? SIZE_MAP.m;
    const direction = clampDirection(readNumber(query, 'direction', 2));

    const request: IAvatarRequest = {
        figure: figure.trim(),
        gender: readGender(query),
        scale: sizing.scale,
        zoom: sizing.zoom,
        direction,
        headDirection: clampDirection(readNumber(query, 'head_direction', direction)),
        headOnly: readBoolean(query, 'headonly'),
        cropped: readBoolean(query, 'crop'),
        frame: Math.max(0, Math.trunc(readNumber(query, 'frame', readNumber(query, 'frame_num', 0)))),
        posture: AvatarAction.POSTURE_STAND,
        actions: [],
        effectId: 0,
        part: readPart(query)
    };

    applyActionParameter(request, readString(query, 'action'));
    applyGestureParameter(request, readString(query, 'gesture'));

    // Habbo accepts these both inside `action=` and as parameters of their own.
    applyIdParameter(request, AvatarAction.CARRY_OBJECT, readNumber(query, 'crr', 0));
    applyIdParameter(request, AvatarAction.USE_OBJECT, readNumber(query, 'drk', 0));
    applyIdParameter(request, AvatarAction.SIGN, readNumber(query, 'sign', 0));
    applyIdParameter(request, AvatarAction.EXPRESSION_JUMP, readNumber(query, 'dance', 0));
    applyIdParameter(request, AvatarAction.EFFECT, readNumber(query, 'effect', 0));

    for(const action of request.actions)
    {
        if(action.type === AvatarAction.EFFECT) request.effectId = Number(action.param) || 0;
    }

    return request;
}

/**
 * A stable identity for the rendered bytes. Everything the composite depends on is in it, and
 * nothing else is — two requests differing only in `img_format` share one entry.
 */
export function avatarCacheKey(request: IAvatarRequest): string
{
    const actions = request.actions
        .map((action) => `${action.type}:${action.param ?? ''}`)
        .sort()
        .join(',');

    return [
        request.figure,
        request.gender ?? '',
        request.scale,
        request.zoom,
        request.direction,
        request.headDirection,
        request.headOnly ? 'head' : 'full',
        request.cropped ? 'crop' : 'full',
        request.frame,
        request.posture,
        request.part,
        actions
    ].join('|');
}

/**
 * `part=` is set by the route, not by the caller: `/effect/…`, `/handitem/…` and `/clothing/…`
 * inject it, and `/avatarimage` never does. It is read from the query rather than passed as an
 * argument so those routes work the way `/avatarimage/<name>.png` already does — by filling in
 * a parameter and handing the query to the same parser.
 */
function readPart(query: AvatarQuery): AvatarPart
{
    switch(readString(query, 'part'))
    {
        case 'clothing': return 'clothing';
        case 'effect': return 'effect';
        case 'hand': return 'hand';
        default: return 'body';
    }
}

function applyActionParameter(request: IAvatarRequest, value: string | null): void
{
    if(value === null) return;

    for(const token of value.split(',').map((entry) => entry.trim()).filter((entry) => entry.length > 0))
    {
        const [rawName, rawParam] = token.split('=');
        const name = rawName.toLowerCase();
        const param = rawParam ?? null;

        if(POSTURE_MAP[name] !== undefined)
        {
            request.posture = POSTURE_MAP[name];

            continue;
        }

        if(EXPRESSION_MAP[name] !== undefined)
        {
            pushAction(request, EXPRESSION_MAP[name], param);

            continue;
        }

        if(PARAMETERISED_MAP[name] !== undefined)
        {
            // `dance` with no id is still a dance — the engine defaults it to the first style.
            pushAction(request, PARAMETERISED_MAP[name], param ?? '1');

            continue;
        }

        if(GESTURES.has(name)) pushAction(request, AvatarAction.GESTURE, name);
    }
}

function applyGestureParameter(request: IAvatarRequest, value: string | null): void
{
    if(value === null) return;

    const gesture = value.trim().toLowerCase();

    if(GESTURES.has(gesture))
    {
        pushAction(request, AvatarAction.GESTURE, gesture);

        return;
    }

    if(EXPRESSION_MAP[gesture] !== undefined) pushAction(request, EXPRESSION_MAP[gesture], null);
}

function applyIdParameter(request: IAvatarRequest, actionType: string, id: number): void
{
    if(!Number.isFinite(id) || id <= 0) return;

    pushAction(request, actionType, String(Math.trunc(id)));
}

function pushAction(request: IAvatarRequest, type: string, param: string | null): void
{
    const existing = request.actions.findIndex((action) => action.type === type);

    if(existing !== -1)
    {
        request.actions[existing] = {type, param};

        return;
    }

    request.actions.push({type, param});
}

function readString(query: AvatarQuery, key: string): string | null
{
    const value = query[key];
    const single = Array.isArray(value) ? value[0] : value;

    return single === undefined || single === '' ? null : single;
}

function readNumber(query: AvatarQuery, key: string, fallback: number): number
{
    const value = readString(query, key);

    if(value === null) return fallback;

    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : fallback;
}

function readBoolean(query: AvatarQuery, key: string): boolean
{
    const value = readString(query, key);

    return value !== null && value !== '0' && value.toLowerCase() !== 'false';
}

function readGender(query: AvatarQuery): string | null
{
    const value = readString(query, 'gender');

    if(value === null) return null;

    const gender = value.trim().toUpperCase();

    return gender === 'M' || gender === 'F' ? gender : null;
}

/** Directions are 0–7 around the compass; anything else wraps rather than failing. */
function clampDirection(value: number): number
{
    const direction = Math.trunc(value) % 8;

    return direction < 0 ? direction + 8 : direction;
}
