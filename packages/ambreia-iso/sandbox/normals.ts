import {Application, Graphics, Mesh, MeshGeometry, Shader, Texture, UniformGroup} from 'pixi.js';
import type {IIsoView} from '../src/IsoView';
import type {IsoStage} from '../src/IsoStage';
import type {IIsoRoomData} from '../src/IIsoRoomData';

// ?normals=1: 50 furni in a grid, their normal maps made from their pictures, lit
// pixel by pixel by a light following the pointer: left without the normals, right with them. A
// test of what normal maps guessed from Habbo art look like, not part of the engine.

const BASIC: [string, number][] = [
    ['chair_polyfon', 18], ['table_polyfon_small', 17], ['sofa_polyfon', 35], ['bed_polyfon_one', 42], ['bed_polyfon', 41],
    ['throne', 230], ['plant_big_cactus', 164], ['fireplace_polyfon', 62], ['lamp_armas', 57], ['lamp_basic', 199],
    ['tv_luxus', 173], ['rare_globe', 293], ['lava_lamp', 541257811], ['chair_plasto', 996661177], ['table_plasto_square', 996661178],
    ['sofachair_polyfon', 34], ['bardesk_polyfon', 130], ['bar_polyfon', 127], ['shelves_polyfon', 14], ['chair_norja', 30],
    ['table_norja_med', 20], ['couch_norja', 29], ['divider_nor1', 248], ['bed_armas_one', 58], ['table_armas', 53],
    ['bench_armas', 52], ['fireplace_armas', 56], ['lamp2_armas', 200], ['carpet_standard', 59], ['plant_pineapple', 160],
    ['plant_sunflower', 171], ['plant_yukka', 165], ['plant_fruittree', 161], ['plant_rose', 172], ['plant_bulrush', 2000027809],
    ['plant_small_cactus', 162], ['plant_mazegate', 2128], ['rare_fountain', 291], ['rare_elephant_statue', 290], ['rare_parasol', 2122],
    ['chair_silo', 26], ['table_silo_med', 21], ['sofa_silo', 28], ['glass_chair', 2020], ['glass_table', 2023],
    ['glass_sofa', 2022], ['hc_chr', 1527], ['hc_tbl', 1528], ['hc_lmp', 1529], ['hc_frplc', 2078]
];
// ?set=hween: twenty busy Halloween furni, to try the tools on harder shapes; their pictures and
// maps go to normals-test-hween/.
const HWEEN: [string, number][] = [
    ['hween08_bed', 2945], ['hween08_bath', 2948], ['hween08_curtain', 2942], ['hween08_trll', 2941], ['hween09_organ', 3282],
    ['hween09_table', 3286], ['hween09_tv', 3292], ['hween09_chandelier', 3294], ['hween09_chair', 3295], ['hween09_mirror', 3293],
    ['hween10_zombie', 3636], ['hween_r24_pumpkindragon', 85159027], ['hween_r24_ele', 85159026], ['hween_r24_vintagepromqueen', 85159028], ['hween_c24_promtable', 85159016],
    ['hween_c24_stackedchairs', 85159021], ['hween_c24_craftingtable', 85158963], ['hween16_rarefountain', 17735937], ['hween_c20_octodemonb', 88768223], ['hween_c20_evilscarecrowb', 88768221]
];
const SET = new URLSearchParams(location.search).get('set');
const FURNI = SET === 'hween' ? HWEEN : BASIC;
const COLUMNS = SET === 'hween' ? 5 : 10;
const SPACING = SET === 'hween' ? 5 : 3;

/** The grid: the set's furni, a few tiles apart; its floor and walls are hidden before the picture is taken. */
export function normalsZone(): IIsoRoomData
{
    const width = COLUMNS * SPACING + 1;
    const length = Math.ceil(FURNI.length / COLUMNS) * SPACING + 1;

    return {
        floor: {width, length, tiles: Array.from({length: width * length}, () => ({height: 0, walkable: true, hole: false})), door: null, doorDirection: 2},
        decor: FURNI.map(([type, definition], i) => ({
            id: `n${i}`, definition, class: type, x: 1 + (i % COLUMNS) * SPACING, y: 1 + Math.floor(i / COLUMNS) * SPACING, z: 0, rotation: 2, state: '0'
        })),
        wallDecor: []
    };
}

/**
 * A normal map guessed from a picture: each pixel's height is its brightness and how far it is
 * from the picture's edge (a rounded silhouette), and its normal the slope of those heights.
 */
function normalMap(image: ImageData): ImageData
{
    const {width, height, data} = image;
    const size = width * height;
    const inside = new Float32Array(size);
    const distance = new Float32Array(size);

    for(let i = 0; i < size; i++)
    {
        inside[i] = data[i * 4 + 3] / 255;
        distance[i] = inside[i] > 0.1 ? 1e6 : 0;
    }

    // Distance to the edge (chamfer, two passes).
    for(let y = 0; y < height; y++)
    {
        for(let x = 0; x < width; x++)
        {
            const i = y * width + x;

            if(x > 0) distance[i] = Math.min(distance[i], distance[i - 1] + 1);
            if(y > 0) distance[i] = Math.min(distance[i], distance[i - width] + 1);
        }
    }

    for(let y = height - 1; y >= 0; y--)
    {
        for(let x = width - 1; x >= 0; x--)
        {
            const i = y * width + x;

            if(x < width - 1) distance[i] = Math.min(distance[i], distance[i + 1] + 1);
            if(y < height - 1) distance[i] = Math.min(distance[i], distance[i + width] + 1);
        }
    }

    const raw = new Float32Array(size);

    for(let i = 0; i < size; i++)
    {
        const brightness = (data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114) / 255;
        const bevel = Math.min(distance[i], 4) / 4;

        raw[i] = inside[i] * (0.4 * brightness + 0.6 * bevel);
    }

    // A light blur, so single pixels do not make spikes.
    const heights = new Float32Array(size);

    for(let y = 1; y < height - 1; y++)
    {
        for(let x = 1; x < width - 1; x++)
        {
            let sum = 0;

            for(let dy = -1; dy <= 1; dy++) for(let dx = -1; dx <= 1; dx++) sum += raw[(y + dy) * width + x + dx];

            heights[y * width + x] = sum / 9;
        }
    }

    const out = new ImageData(width, height);
    // ?strength=: how steep the guessed relief is (3: gentle).
    const strength = Number(new URLSearchParams(location.search).get('strength') ?? 3);

    for(let y = 1; y < height - 1; y++)
    {
        for(let x = 1; x < width - 1; x++)
        {
            const i = y * width + x;
            const nx = -(heights[i + 1] - heights[i - 1]) * strength;
            const ny = -(heights[i + width] - heights[i - width]) * strength;
            const length = Math.hypot(nx, ny, 1);

            out.data[i * 4] = (nx / length * 0.5 + 0.5) * 255;
            out.data[i * 4 + 1] = (ny / length * 0.5 + 0.5) * 255;
            out.data[i * 4 + 2] = (1 / length * 0.5 + 0.5) * 255;
            out.data[i * 4 + 3] = data[i * 4 + 3];
        }
    }

    return out;
}

const VERTEX = `#version 300 es
in vec2 aPosition;
in vec2 aUV;
out vec2 vUV;
uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;
uniform mat3 uTransformMatrix;

void main()
{
    mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
    gl_Position = vec4((mvp * vec3(aPosition, 1.0)).xy, 0.0, 1.0);
    vUV = aUV;
}`;

const FRAGMENT = `#version 300 es
precision mediump float;
in vec2 vUV;
out vec4 finalColor;
uniform sampler2D uDiffuse;
uniform sampler2D uNormal;
uniform vec3 uLight;
uniform vec2 uSize;
uniform float uUseNormals;
uniform vec3 uAmbient;
uniform vec3 uColor;
uniform float uRadius;
uniform float uAmount;
uniform float uWrap;

void main()
{
    vec4 colour = texture(uDiffuse, vUV);

    if(colour.a < 0.01) discard;

    // uAmount: how much of the map, mixed with a flat surface; uWrap: how far light wraps round to
    // the faces turned away from it (0: Lambert, they go black; 1: half-Lambert).
    vec3 flat_ = vec3(0.0, 0.0, 1.0);
    vec3 normal = uUseNormals > 0.5 ? normalize(mix(flat_, normalize(texture(uNormal, vUV).rgb * 2.0 - 1.0), uAmount)) : flat_;
    vec3 toLight = uLight - vec3(vUV * uSize, 0.0);
    float distance = length(toLight);
    float reach = clamp(1.0 - distance / uRadius, 0.0, 1.0);
    float diffuse = max((dot(normal, toLight / distance) + uWrap) / (1.0 + uWrap), 0.0);
    vec3 lit = colour.rgb / max(colour.a, 0.001) * (uAmbient + uColor * diffuse * reach * reach);

    finalColor = vec4(lit * colour.a, colour.a);
}`;

/**
 * Each furni alone, without its shadow, as a PNG on a transparent ground at its own size, and where it sits in the
 * whole picture (taken at (atlasX, atlasY)): for normal map tools, whose maps can be put back at
 * the same place. Everything else is hidden for the one picture, inside one tick.
 */
function exportFurni(app: Application, view: IIsoView, atlasX: number, atlasY: number): {name: string; x: number; y: number; width: number; height: number; png: string}[]
{
    const canvas = (view as unknown as {_canvas: {_sortableSpriteList: ({name: string; objectType: string; sprite: {assetName: string} | null} | null)[]; _display: {children: {visible: boolean}[]}}})._canvas;
    const list = canvas._sortableSpriteList;
    const children = canvas._display.children;
    const types = new Set(FURNI.map(([type]) => type));
    const objects = new Map<string, string>();
    const out = [];

    for(let i = 0; i < children.length; i++)
    {
        const entry = list[i];

        if(entry && types.has(entry.objectType)) objects.set(entry.name, entry.objectType);
    }

    for(const [id, type] of objects)
    {
        // Its shadow on the floor (the `sd` layer) is left out: a normal map tool would read it as relief.
        for(let i = 0; i < children.length; i++) children[i].visible = list[i]?.name === id && !list[i]?.sprite?.assetName.includes('_sd_');

        const bounds = view.container.getBounds();
        const picture = app.renderer.extract.canvas({target: view.container}) as HTMLCanvasElement;

        out.push({name: type, x: Math.round(bounds.x - atlasX), y: Math.round(bounds.y - atlasY), width: picture.width, height: picture.height, png: picture.toDataURL('image/png')});
    }

    for(const child of children) child.visible = true;

    return out;
}

/** Where `exportFurni()`'s pictures go (.ambreia-build/normals-test/), served by Vite's /@fs/. */
const TEST_FOLDER = '/@fs/D:/Developpment/Habbo/vortex-rpg-client/.ambreia-build/normals-test' + (SET ? '-' + SET : '');

/**
 * ?tool=<name>: the normal maps a tool made out of the exported pictures, from normals/<name>/
 * (`<furni>.png`, `<furni>_n.png` or `<furni>_normal.png`), each put back where its furni is; a
 * furni without one stays flat. ?flipY=1 for a tool whose green channel points up.
 */
async function toolNormals(target: HTMLCanvasElement, tool: string, furni: {name: string; x: number; y: number}[]): Promise<void>
{
    const context = target.getContext('2d')!;
    const flipY = new URLSearchParams(location.search).get('flipY') === '1';

    context.fillStyle = 'rgb(128, 128, 255)';
    context.fillRect(0, 0, target.width, target.height);

    for(const {name, x, y} of furni)
    {
        for(const suffix of ['', '_n', '_normal', '_Normal'])
        {
            const response = await fetch(`${TEST_FOLDER}/normals/${tool}/${name}${suffix}.png`);

            if(!response.ok || !response.headers.get('content-type')?.startsWith('image')) continue;

            const image = await createImageBitmap(await response.blob());

            // Over what is there: its transparent pixels leave a neighbour's normals as they were.
            context.drawImage(image, x, y);
            break;
        }
    }

    if(!flipY) return;

    const pixels = context.getImageData(0, 0, target.width, target.height);

    for(let i = 1; i < pixels.data.length; i += 4) pixels.data[i] = 255 - pixels.data[i];

    context.putImageData(pixels, 0, 0);
}

/** Replaces the view by the two lit panels once the furni are in. */
export async function showNormals(app: Application, view: IIsoView, stage: IsoStage): Promise<void>
{
    const model = stage.getRoom('zone')?.getObjects(0)[0]?.getModelController();

    model?.setNumber('room_floor_visibility', 0);
    model?.setNumber('room_wall_visibility', 0);
    await new Promise(done => setTimeout(done, 10000));

    const atlas = view.container.getBounds();
    const picture = app.renderer.extract.canvas({target: view.container}) as HTMLCanvasElement;
    const exported = exportFurni(app, view, atlas.x, atlas.y);
    const context = picture.getContext('2d')!;
    const pixels = context.getImageData(0, 0, picture.width, picture.height);
    const normals = document.createElement('canvas');

    normals.width = picture.width;
    normals.height = picture.height;
    const tool = new URLSearchParams(location.search).get('tool');

    if(tool) await toolNormals(normals, tool, exported);
    else normals.getContext('2d')!.putImageData(normalMap(pixels), 0, 0);

    const diffuse = Texture.from(picture);
    const normal = Texture.from(normals);

    // Pixels stay pixels when a panel is shown bigger (focus()), as the game draws them.
    diffuse.source.scaleMode = 'nearest';
    normal.source.scaleMode = 'nearest';
    const {width, height} = picture;
    const scale = Math.min((app.screen.width / 2 - 20) / width, (app.screen.height - 40) / height);
    const panels: {mesh: Mesh; uniforms: UniformGroup}[] = [];

    app.stage.removeChildren();

    // ?amount=0..1 and ?wrap=0..1: see the fragment shader; tune() changes them live.
    const search = new URLSearchParams(location.search);
    const night = search.get('night') === '1';

    // By night the ground is as dark as the room, and the light a lantern held low.
    if(night) app.renderer.background.color = 0x07080e;

    for(const useNormals of [0, 1])
    {
        const uniforms = new UniformGroup({
            uLight: {value: new Float32Array([width / 2, height / 2, night ? 45 : 90]), type: 'vec3<f32>'},
            uSize: {value: new Float32Array([width, height]), type: 'vec2<f32>'},
            uUseNormals: {value: useNormals, type: 'f32'},
            // ?night=1: a dark blue night, the pointer's light (?radius=, 240 then) alone shows the room.
            uAmbient: {value: new Float32Array(night ? [0.06, 0.07, 0.14] : [0.22, 0.24, 0.32]), type: 'vec3<f32>'},
            uColor: {value: new Float32Array([1.25, 1.05, 0.8]), type: 'vec3<f32>'},
            uRadius: {value: Number(search.get('radius') ?? (night ? 240 : 520)), type: 'f32'},
            uAmount: {value: Number(search.get('amount') ?? 1), type: 'f32'},
            uWrap: {value: Number(search.get('wrap') ?? 0), type: 'f32'}
        });
        const shader = Shader.from({
            gl: {vertex: VERTEX, fragment: FRAGMENT},
            resources: {uDiffuse: diffuse.source, uNormal: normal.source, uniforms}
        });
        const geometry = new MeshGeometry({
            positions: new Float32Array([0, 0, width, 0, width, height, 0, height]),
            uvs: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
            indices: new Uint32Array([0, 1, 2, 0, 2, 3])
        });
        const mesh = new Mesh({geometry, shader});

        mesh.scale.set(scale);
        mesh.position.set(10 + useNormals * app.screen.width / 2, 30);
        app.stage.addChild(mesh);
        panels.push({mesh, uniforms});
    }

    app.stage.eventMode = 'static';
    app.stage.hitArea = app.screen;
    app.stage.on('pointermove', event =>
    {
        // The same spot over both pictures: the pointer's place in the panel it is over.
        const over = panels.find(panel => panel.mesh.getBounds().containsPoint(event.global.x, event.global.y)) ?? panels[0];
        const local = over.mesh.toLocal(event.global);

        for(const {uniforms} of panels)
        {
            uniforms.uniforms.uLight[0] = local.x;
            uniforms.uniforms.uLight[1] = local.y;
        }
    });

    const setLight = (x: number, y: number): void =>
    {
        for(const {uniforms} of panels)
        {
            uniforms.uniforms.uLight[0] = x;
            uniforms.uniforms.uLight[1] = y;
        }
    };

    // Each panel clipped to its half of the screen, for focus().
    for(let i = 0; i < panels.length; i++)
    {
        const half = new Graphics().rect(i * app.screen.width / 2, 0, app.screen.width / 2 - 4, app.screen.height).fill(0xffffff);

        app.stage.addChild(half);
        panels[i].mesh.mask = half;
    }

    /**
     * Both panels at a whole zoom (1: the engine's own pixels), the picture's point (x, y) in the
     * middle of each half, the light at (lightX, lightY) in the picture.
     */
    const focus = (x: number, y: number, zoom: number, lightX: number, lightY: number): void =>
    {
        for(let i = 0; i < panels.length; i++)
        {
            panels[i].mesh.scale.set(zoom);
            panels[i].mesh.position.set(Math.round((i + 0.5) * app.screen.width / 2 - x * zoom), Math.round(app.screen.height / 2 - y * zoom));
        }

        setLight(lightX, lightY);
    };

    const tune = (amount: number, wrap: number): void =>
    {
        for(const {uniforms} of panels)
        {
            uniforms.uniforms.uAmount = amount;
            uniforms.uniforms.uWrap = wrap;
        }
    };

    (window as unknown as {normalsTest: unknown}).normalsTest = {panels, exported, setLight, focus, tune};
}
