import defaults from './legacy.defaults.json';

/**
 * The legacy properties every client starts from, before config.json's `legacy` section. A key
 * leaves this file when the feature that reads it gets its own config section.
 */
export const LEGACY_DEFAULTS: Readonly<Record<string, string>> = defaults;
