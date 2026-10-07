import type {IDisposable} from '../core/runtime/index';

/**
 * Perk allowance data
 */
export interface IPerkAllowance
{
    readonly code: string;
    readonly errorMessage: string;
    readonly isAllowed: boolean;
}

/**
 * Interface for perk manager
 * Based on AS3 com.sulake.habbo.session.PerkManager
 */
export interface IPerkManager extends IDisposable
{
    /**
	 * Whether the perk data has been loaded
	 */
    readonly isReady: boolean;

    /**
	 * Check if a perk is allowed for the user
	 */
    isPerkAllowed(perkCode: string): boolean;

    /**
	 * Get the error message for a perk (why it's not allowed)
	 */
    getPerkErrorMessage(perkCode: string): string;
}
