/**
 * Reading furni pieces of an .ambreia directory from a Node tool: the piece's manifest as the .nitro
 * had it, and its spritesheet decoded. Shared by furni-lights.ts and furni-sheets.ts.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {decodePiece, inflateManifest} from '@ambreia/common/assets/pack/AmbreiaPiece';
import type {IPieceImage} from '@ambreia/common/assets/pack/AmbreiaPiece';
import {decodeManifest} from '@ambreia/common/assets/pack/ManifestCodec';
import type {IEncodedManifest} from '@ambreia/common/assets/pack/ManifestCodec';
import {decodeMasterKey, encryptedLayout, plainLayout} from '@ambreia/common/assets/pack/AmbreiaLayout';
import type {IAmbreiaLayout, LogicalPath} from '@ambreia/common/assets/pack/AmbreiaLayout';
import type {IAmbreiaDescriptor} from '@ambreia/common/assets/pack/AmbreiaDirectory';

export type Json = Record<string, unknown>;

export interface IRgba
{
    width: number;
    height: number;
    data: Buffer;
}

export interface IAmbreiaPieces
{
    layout: IAmbreiaLayout;
    dictionary: Uint8Array;
    /** Where a logical file is on disk. */
    fileOf(logical: LogicalPath): Promise<string>;
    readPiece(name: string): Promise<{manifest: Json; images: IPieceImage[]; dictionaryId: string}>;
    /** The spritesheet image of a piece, decoded. */
    sheetOf(images: IPieceImage[]): Promise<IRgba>;
}

/** Opens an .ambreia directory; exits with a message when it is encrypted and no key is given. */
export async function openAmbreia(directory: string, keyFile: string): Promise<IAmbreiaPieces>
{
    const descriptor = JSON.parse(fs.readFileSync(path.join(directory, 'ambreia.json'), 'utf8')) as IAmbreiaDescriptor & {dictionary: string; encrypted?: boolean};

    if(descriptor.encrypted && !keyFile)
    {
        console.error(`${directory} is encrypted: give its key with --key-file`);
        process.exit(2);
    }

    const layout: IAmbreiaLayout = descriptor.encrypted ? await encryptedLayout(decodeMasterKey(fs.readFileSync(keyFile, 'utf8'))) : plainLayout();
    const fileOf = async (logical: LogicalPath): Promise<string> => path.join(directory, ...(await layout.path(logical)).split('/'));
    const readOpened = async (logical: LogicalPath): Promise<Uint8Array> => layout.open(logical, new Uint8Array(fs.readFileSync(await fileOf(logical))));
    const dictionary = await readOpened({kind: 'dictionary', id: descriptor.dictionary});

    return {
        layout,
        dictionary,
        fileOf,
        async readPiece(name)
        {
            const piece = decodePiece(await readOpened({kind: 'piece', name}), name);
            const encoded = JSON.parse(new TextDecoder().decode(inflateManifest(piece.manifest, dictionary))) as IEncodedManifest;

            return {manifest: decodeManifest(encoded) as Json, images: piece.images, dictionaryId: piece.dictionaryId};
        },
        async sheetOf(images)
        {
            const image = images[0];
            const bytes = image.bytes ?? await readOpened({kind: 'image', sha1: image.shared!, format: image.format});
            const {data, info} = await sharp(Buffer.from(bytes)).ensureAlpha().raw().toBuffer({resolveWithObject: true});

            return {width: info.width, height: info.height, data};
        }
    };
}
