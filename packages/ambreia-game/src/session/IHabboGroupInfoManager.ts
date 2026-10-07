import type {IDisposable} from '../core/runtime/index';

/**
 * Interface for Habbo group info manager
 * Based on AS3 com.sulake.habbo.session.HabboGroupInfoManager
 */
export interface IHabboGroupInfoManager extends IDisposable
{
    /**
	 * Get the badge ID for a group
	 */
    getBadgeId(groupId: number): string | null;
}
