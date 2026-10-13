import type {IClassDefinition} from '../IClassDefinition';
import type {ISkillDefinition} from '../ISkillDefinition';
import type {IStatusDefinition} from '../IStatusDefinition';

/**
 * The server's public definitions (what each skill aims at and whether the global cooldown holds
 * it, M1b §5.1, and what the skills, statuses and classes draw), loaded once per session; a load
 * that failed is tried again on the next zone. Without them a ground skill is refused (invalid_target).
 */
export class DefinitionsLoader
{
    private _loading: Promise<void> | null = null;

    /**
     * @param fetchKind - one kind's definitions (`skill`, `status`, `class`); throws when it did not load
     * @param define - all three arrived
     * @param onError - they did not
     */
    constructor(
        private readonly _fetchKind: (kind: string) => Promise<unknown[]>,
        private readonly _define: (skills: ISkillDefinition[], statuses: IStatusDefinition[], classes: IClassDefinition[]) => void,
        private readonly _onError: (error: unknown) => void = () => {}
    ) {}

    load(): Promise<void>
    {
        return this._loading ??= (async () =>
        {
            try
            {
                const [skills, statuses, classes] = await Promise.all(['skill', 'status', 'class'].map(kind => this._fetchKind(kind)));

                this._define(skills as ISkillDefinition[], statuses as IStatusDefinition[], classes as IClassDefinition[]);
            }
            catch (error)
            {
                this._loading = null;
                this._onError(error);
            }
        })();
    }
}
