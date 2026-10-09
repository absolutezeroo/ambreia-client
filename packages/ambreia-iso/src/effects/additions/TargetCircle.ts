import {Texture} from 'pixi.js';
import {platform} from '@ambreia/common/platform/Platform';
import {AlphaTolerance} from '../../object/enum/AlphaTolerance';
import type {IRoomObjectSprite} from '../../object/visualization/IRoomObjectSprite';
import type {IAvatarAddition} from '../../avatar/visualization/additions/IAvatarAddition';

/** The ring's colour and its fill's opacity. */
const COLOR = '224, 48, 40';
const FILL = 0.18;

/**
 * The ring under the avatar the player targets (RPG F3b §7.3): an ellipse at its feet, behind it
 * like its shadow (AvatarVisualization.updateShadow()). It draws its own pixels, one texture per
 * scale for the whole room, made on first use.
 */
// TS-only: the RPG's target; Habbo has no target.
export class TargetCircle implements IAvatarAddition
{
    private static readonly TEXTURES = new Map<number, Texture>();
    private _disposed = false;

    constructor(readonly id: number) {}

    get disposed(): boolean
    {
        return this._disposed;
    }

    update(sprite: IRoomObjectSprite | null, scale: number): void
    {
        if(!sprite) return;

        const small = scale < 48;
        const width = small ? 24 : 48;
        const height = width / 2;

        sprite.visible = true;
        // No name: AvatarVisualization.applyAdditionTexture() keeps a texture an addition set itself.
        sprite.assetName = '';
        sprite.texture = TargetCircle.texture(width, height);
        sprite.offsetX = -width / 2;
        sprite.offsetY = -height / 2 - (small ? 1 : 3);
        sprite.relativeDepth = 1;
        sprite.alphaTolerance = AlphaTolerance.MATCH_NOTHING;
    }

    animate(): boolean
    {
        return false;
    }

    private static texture(width: number, height: number): Texture
    {
        let texture = TargetCircle.TEXTURES.get(width);

        if(texture) return texture;

        const canvas = platform().createCanvas(width, height);
        const context = canvas.getContext('2d') as CanvasRenderingContext2D;

        context.beginPath();
        context.ellipse(width / 2, height / 2, width / 2 - 1.5, height / 2 - 1.5, 0, 0, Math.PI * 2);
        context.fillStyle = `rgba(${COLOR}, ${FILL})`;
        context.fill();
        context.lineWidth = 2;
        context.strokeStyle = `rgb(${COLOR})`;
        context.stroke();

        texture = Texture.from({resource: canvas as unknown as HTMLCanvasElement, scaleMode: 'nearest'});
        TargetCircle.TEXTURES.set(width, texture);

        return texture;
    }

    dispose(): void
    {
        this._disposed = true;
    }
}
