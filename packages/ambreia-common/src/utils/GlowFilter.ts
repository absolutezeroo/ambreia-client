import {Color, defaultFilterVert, Filter, GlProgram} from 'pixi.js';
import {foldedBoxWeights, GLOW_MAX_TAPS, padGlowWeights} from './GlowKernel';

/**
 * `flash.filters.GlowFilter`, as a PixiJS filter.
 *
 * Ten AS3 classes across this port construct one — the furni chest's floating icons, the wired
 * selection and variable-holder highlights, the avatar's variable-holder tint, the toolbar and
 * bottom-bar labels, the onboarding dialogs — and until now the port had no equivalent, so every
 * one of them either shipped without its halo or carried a marker saying so.
 *
 * **How Flash's filter behaves, and what this reproduces.** The source's alpha channel is blurred
 * by `blurX`/`blurY`, multiplied by `strength` and clamped, and the result painted in `color` at
 * `alpha` — behind the source for an outer glow, clipped to the source for an inner one. Both
 * branches are here.
 *
 * **`quality` is applied**, in one pass rather than Flash's several. `q` successive box blurs of
 * the same radius are one convolution with the box folded into itself `q` times, so the kernel is
 * computed on the CPU (`foldedBoxWeights()`) and the shader samples `4q + 1` taps per axis instead
 * of re-running. Same result, one surface pass; `q` is clamped at 3, where the grid is already
 * 13x13.
 *
 * `knockout` is applied: it drops the source and keeps the glow alone. Every one of the ten
 * `new GlowFilter(...)` constructions in the primary AS3 tree passes `false`, so nothing exercises
 * it today — it is implemented rather than ignored because a silently-dropped argument changes
 * what is drawn.
 *
 * The shader is GLSL only. The port never sets `preference` on `Application.init()`, so PixiJS
 * picks its WebGL default; a WGSL twin would have to be added before that changes.
 */
// TS-only: no AS3 counterpart — this is the Flash player's own filter, which AS3 imports from
// `flash.filters` and this port has to supply.
export class GlowFilter extends Filter
{
    /**
	 * No `#version` directive, deliberately: that is how every filter PixiJS ships is written,
	 * and it is what makes `GlProgram` inject the WebGL1 compatibility defines
	 * (`in` -> varying, `finalColor` -> gl_FragColor, `texture` -> texture2D).
	 */
    // TS-only: the filter's fragment shader — see the class doc for what it reproduces.
    private static readonly FRAGMENT: string = `
in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
// highp, matching the default filter vertex shader: the fragment stage defaults to mediump and
// WebGL refuses to link a program whose shared uniform has two precisions. PixiJS' own
// displacement filter declares it the same way.
uniform highp vec4 uInputSize;
uniform vec4 uInputClamp;

uniform vec3 uGlowColor;
uniform float uGlowAlpha;
uniform float uStrength;
uniform vec2 uBlur;
uniform float uInner;
uniform float uKnockout;
uniform int uTapCount;
uniform float uWeights[13];

void main(void)
{
    vec4 src = texture(uTexture, vTextureCoord);

    // Separable kernel over the alpha channel. The taps sit blur/2 apart, so the base 5-tap
    // kernel spans -blur..+blur and a quality-fold one spans quality times that -- which is
    // exactly where quality successive box blurs of radius blur land. uWeights is that folded
    // kernel, already normalised on the CPU, so nothing is divided here.
    // Named tapStep because a plain 'step' would shadow the GLSL built-in of that name.
    vec2 tapStep = uBlur * uInputSize.zw * 0.5;
    int mid = uTapCount / 2;
    float blurred = 0.0;

    for(int y = 0; y < uTapCount; y++)
    {
        float wy = uWeights[y];

        for(int x = 0; x < uTapCount; x++)
        {
            vec2 offset = vec2(float(x - mid), float(y - mid)) * tapStep;
            vec2 uv = clamp(vTextureCoord + offset, uInputClamp.xy, uInputClamp.zw);

            blurred += texture(uTexture, uv).a * uWeights[x] * wy;
        }
    }

    // Everything here is premultiplied alpha, which is what the filter pipeline hands over.
    float outerA = clamp(blurred * uStrength, 0.0, 1.0) * uGlowAlpha;
    vec4 outer = src + vec4(uGlowColor * outerA, outerA) * (1.0 - src.a);

    float innerA = clamp((1.0 - blurred) * uStrength, 0.0, 1.0) * uGlowAlpha * src.a;
    vec4 inner = vec4(mix(src.rgb, uGlowColor * src.a, innerA), src.a);

    vec4 composited = mix(outer, inner, uInner);

    // Knockout drops the source and keeps only the glow. Flash describes it as making the
    // source transparent, which for an outer glow is the halo alone and for an inner glow is
    // the part of the halo that fell inside the shape.
    float knockoutA = mix(outerA, innerA, uInner);
    vec4 knockedOut = vec4(uGlowColor * knockoutA, knockoutA);

    finalColor = mix(composited, knockedOut, uKnockout);
}
`;

    /**
	 * Flash's own argument list and defaults, in order.
	 */
    // TS-only: mirrors `flash.filters.GlowFilter`'s constructor so the ported call sites read
    // like their AS3 originals.
    constructor(
        color: number = 0xFF0000,
        alpha: number = 1,
        blurX: number = 6,
        blurY: number = 6,
        strength: number = 2,
        quality: number = 1,
        inner: boolean = false,
        knockout: boolean = false
    )
    {
        const rgb = new Color(color).toArray();
        const weights = foldedBoxWeights(quality);

        super({
            glProgram: GlProgram.from({
                vertex: defaultFilterVert,
                fragment: GlowFilter.FRAGMENT,
                name: 'glow-filter'
            }),
            resources: {
                glowUniforms: {
                    uGlowColor: {value: new Float32Array([rgb[0], rgb[1], rgb[2]]), type: 'vec3<f32>'},
                    uGlowAlpha: {value: alpha, type: 'f32'},
                    uStrength: {value: strength, type: 'f32'},
                    uBlur: {value: new Float32Array([blurX, blurY]), type: 'vec2<f32>'},
                    uInner: {value: inner ? 1 : 0, type: 'f32'},
                    uKnockout: {value: knockout ? 1 : 0, type: 'f32'},
                    uTapCount: {value: weights.length, type: 'i32'},
                    uWeights: {value: padGlowWeights(weights), type: 'f32', size: GLOW_MAX_TAPS}
                }
            },
            // Without this the glow is clipped to the sprite's own bounds.
            padding: Math.ceil(Math.max(blurX, blurY))
        });

        this._quality = quality;
        this._knockout = knockout;
    }

    // TS-only: kept so a caller can read back what it passed.
    private _quality: number;

    // TS-only: mirrors the uniform, so a caller can read back what it passed.
    private _knockout: boolean;

    // TS-only: mirrors `flash.filters.GlowFilter.quality`, applied through `uWeights`/`uTapCount`.
    get quality(): number
    {
        return this._quality;
    }

    // TS-only: `flash.filters.GlowFilter.knockout`, applied through the `uKnockout` uniform.
    get knockout(): boolean
    {
        return this._knockout;
    }
}
