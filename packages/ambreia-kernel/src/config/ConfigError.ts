/** A configuration the client cannot start with: every faulty field, named (spec §5.5). */
export class ConfigError extends Error
{
    public readonly issues: readonly string[];

    constructor(issues: readonly string[])
    {
        super(`Invalid configuration:\n${issues.map(issue => `  ${issue}`).join('\n')}`);
        this.name = 'ConfigError';
        this.issues = issues;
    }
}
