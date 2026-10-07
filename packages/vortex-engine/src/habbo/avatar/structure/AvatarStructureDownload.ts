import EventEmitter from 'eventemitter3';
import type {IStructureData} from './IStructureData';
import {parseXmlDocument} from './AvatarXmlUtils';
import {Logger} from '@ambreia/common/utils/Logger';

const log = Logger.getLogger('habbo.avatar.structure.AvatarStructureDownload');

/**
 * Downloads and applies additional avatar structure data (figure part lists).
 *
 * @see sources/win63_version/habbo/avatar/structure/AvatarStructureDownload.as
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/structure/AvatarStructureDownload.as
 */
export class AvatarStructureDownload extends EventEmitter 
{
    // AS3: .../src/com/sulake/habbo/avatar/structure/AvatarStructureDownload.as::STRUCTURE_DONE
    public static readonly STRUCTURE_DONE: string = 'AVATAR_STRUCTURE_DONE';

    private _structureData: IStructureData;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/AvatarStructureDownload.as::AvatarStructureDownload()
    constructor(url: string, structureData: IStructureData) 
    {
        super();

        this._structureData = structureData;
        this.download(url);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/AvatarStructureDownload.as::onDataComplete()
    private async download(url: string): Promise<void> 
    {
        try 
        {
            const response = await fetch(url);

            if(!response.ok) 
            {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const text = await response.text();
            const document = parseXmlDocument(text);

            if(document === null) 
            {
                throw new Error(`Invalid avatar structure XML from ${url}`);
            }

            this._structureData.appendXML(document);
            this.emit(AvatarStructureDownload.STRUCTURE_DONE);
        }
        catch (error) 
        {
            log.error('Failed to download structure data', error);
        }
    }
}