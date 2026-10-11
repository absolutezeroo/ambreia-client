/**
 * ExtraDataManager
 *
 * @see com.sulake.habbo.room.object.visualization.data.ExtraDataManager
 *
 * Batches thumbnail-URL lookups for external-image furniture (selfies) whose `furniture_data`
 * only carries a photo id: up to 50 pending visualizations are collected and POSTed as one
 * request every 200ms, and the response is fanned back out to each waiting visualization via
 * `onUrlFromExtraDataService()`. Used only when `FurnitureExternalImageVisualization` is
 * configured with `extra_data_batches_enabled = true`; otherwise each visualization resolves its
 * own id individually (`FurnitureExternalImageVisualization.loadExtraData()`).
 *
 * AS3 loads with `flash.net.URLLoader`; this port uses `fetch()`, the browser equivalent already
 * used for the individual (non-batched) request in `FurnitureExternalImageVisualization`.
 */
import {Logger} from '@ambreia/common/utils/Logger';

const log = Logger.getLogger('habbo.room.object.visualization.data.ExtraDataManager');

interface IExtraDataResult
{
    id: string;
    url: string;
    status?: string;
}

export interface IExtraDataVisualization
{
    getExternalImageUUID(): string | null;
    getExtraDataUrl(): string | null;
    onUrlFromExtraDataService(url: string): void;
}

export class ExtraDataManager
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/data/ExtraDataManager.as::STATUS_REJECTED
    static readonly STATUS_REJECTED: string = 'REJECTED';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/data/ExtraDataManager.as::BATCH_MAX_QUERY_AMOUNT
    private static readonly BATCH_MAX_QUERY_AMOUNT: number = 50;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/data/ExtraDataManager.as::instance
    private static _instance: ExtraDataManager | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/data/ExtraDataManager.as::inputVisualizationQueue
    private _inputQueue: IExtraDataVisualization[] = [];
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/data/ExtraDataManager.as::outputVisualizationQueue
    private _outputQueue: IExtraDataVisualization[] = [];

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/data/ExtraDataManager.as::ExtraDataManager()
    private constructor()
    {
        this.setTimedBatchCheck();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/data/ExtraDataManager.as::getInstance()
    private static getInstance(): ExtraDataManager
    {
        if(ExtraDataManager._instance === null)
        {
            ExtraDataManager._instance = new ExtraDataManager();
        }

        return ExtraDataManager._instance;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/data/ExtraDataManager.as::requestExtraDataUrl()
    static requestExtraDataUrl(visualization: IExtraDataVisualization): void
    {
        ExtraDataManager.getInstance()._inputQueue.push(visualization);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/data/ExtraDataManager.as::furnitureDisposed()
    static furnitureDisposed(visualization: IExtraDataVisualization): void
    {
        ExtraDataManager.getInstance().removeFurniFromManager(visualization);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/data/ExtraDataManager.as::setTimedBatchCheck()
    private setTimedBatchCheck(): void
    {
        setInterval((): void => this.handleBatch(), 200);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/data/ExtraDataManager.as::removeFurniFromManager()
    private removeFurniFromManager(visualization: IExtraDataVisualization): void
    {
        let index = this._inputQueue.indexOf(visualization);

        if(index !== -1)
        {
            this._inputQueue.splice(index, 1);
        }

        index = this._outputQueue.indexOf(visualization);

        if(index !== -1)
        {
            this._outputQueue.splice(index, 1);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/data/ExtraDataManager.as::handleBatch()
    private handleBatch(): void
    {
        if(this._inputQueue.length === 0)
        {
            return;
        }

        const ids: string[] = [];
        let extraDataUrl: string | null = null;

        for(let i = 0; i < ExtraDataManager.BATCH_MAX_QUERY_AMOUNT; i++)
        {
            if(this._inputQueue.length > 0)
            {
                const visualization = this._inputQueue.shift()!;

                ids.push(visualization.getExternalImageUUID() ?? '');
                extraDataUrl = visualization.getExtraDataUrl();
                this._outputQueue.push(visualization);
            }
        }

        if(ids.length === 0 || extraDataUrl === null)
        {
            return;
        }

        fetch(extraDataUrl, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(ids)
        })
            .then(response => response.text())
            .then(text => this.onExtraDataLoaded(text))
            .catch((error: unknown) => this.onExtraDataError(error));
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/data/ExtraDataManager.as::onExtraDataLoaded()
    private onExtraDataLoaded(responseText: string): void
    {
        if(responseText.length === 0)
        {
            return;
        }

        try
        {
            const results = JSON.parse(responseText) as IExtraDataResult[];

            for(const result of results)
            {
                // AS3 mutates `outputVisualizationQueue` (via `removeFurniFromManager()`) while
                // iterating it with `for each` - the same live-array iteration this port replays
                // with `for...of` directly over `_outputQueue`, rather than a defensive copy.
                for(const visualization of this._outputQueue)
                {
                    if(visualization.getExternalImageUUID() === result.id)
                    {
                        if(result.status === ExtraDataManager.STATUS_REJECTED)
                        {
                            visualization.onUrlFromExtraDataService(ExtraDataManager.STATUS_REJECTED);
                        }
                        else
                        {
                            visualization.onUrlFromExtraDataService(result.url);
                        }

                        this.removeFurniFromManager(visualization);
                    }
                }
            }
        }
        catch
        {
            log.warn('Failed to read JSON from ExtraData service');
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/data/ExtraDataManager.as::onExtraDataError()
    private onExtraDataError(error: unknown): void
    {
        log.warn(`Failed to load ExtraData batch ${String(error)}`);
    }
}
