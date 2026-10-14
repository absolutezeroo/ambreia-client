import {Logger} from '@ambreia/common/utils/Logger';
import type {IQuestDefinition} from './IQuestDefinition';

const log = Logger.getLogger('habbo.features.quests.QuestDefinitions');

/** The quests' public definitions (level, rewards), loaded once; a load that failed is tried again next time. */
export class QuestDefinitions
{
    private _byId = new Map<string, IQuestDefinition>();
    private _loading: Promise<void> | null = null;

    constructor(private readonly _fetch: () => Promise<unknown[]>) {}

    load(): Promise<void>
    {
        return this._loading ??= (async () =>
        {
            try
            {
                const quests = await this._fetch() as IQuestDefinition[];

                this._byId = new Map(quests.map(quest => [quest.id, quest]));
            }
            catch (error)
            {
                this._loading = null;
                log.warn('the quest definitions did not load — the journal shows no level nor rewards', error);
            }
        })();
    }

    of(questId: string): IQuestDefinition | null
    {
        return this._byId.get(questId) ?? null;
    }
}
