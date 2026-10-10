import defaults from './legacy.defaults.json';

/**
 * The legacy `key=value` properties every host starts from (the client under config.json's
 * `legacy` section, the imager under its asset host). A key leaves this file when the feature
 * that reads it gets its own config section.
 */
export const LEGACY_DEFAULTS: Readonly<Record<string, string>> = defaults;
