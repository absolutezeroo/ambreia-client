import type {IAssetDirectories} from '@ambreia/common/assets/pack/AssetDirectories';

/**
 * The .ambreia directories the room content comes from (spec 2026-10-09-ambreia-everything): the
 * furniture (wall items included), the pets, and the room's own bundles (planes, cursor, placeholders).
 */
export type IRoomContentDirectories = Pick<IAssetDirectories, 'furniture' | 'pets' | 'room'>;
