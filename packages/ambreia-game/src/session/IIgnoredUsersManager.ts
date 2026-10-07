import type {IDisposable} from '../core/runtime/index';

/**
 * Ignore result codes from server
 */
export const IgnoreResult = {
    FAILED: 0,
    IGNORED: 1,
    IGNORED_LIST_FULL: 2,  // User was ignored but oldest entry was removed
    UNIGNORED: 3
} as const;

/**
 * Interface for ignored users manager
 * Based on AS3 com.sulake.habbo.session.IgnoredUsersManager
 */
export interface IIgnoredUsersManager extends IDisposable
{
    /**
	 * Request the ignore list from server
	 */
    initIgnoreList(): void;

    /**
	 * Ignore a user by their ID
	 */
    ignoreUser(userId: number): void;

    /**
	 * Unignore a user by their ID
	 */
    unignoreUser(userId: number): void;

    /**
	 * Check if a user is ignored
	 */
    isIgnored(userId: number): boolean;
}
