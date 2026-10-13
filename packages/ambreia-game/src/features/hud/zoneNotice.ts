import type {IToast} from './IToast';

/**
 * The zone's own server dialogs (types `zone.*`: an area's name and rules, a level advice, a closed
 * passage, a clock's announcement) are passing notices: a toast, the first line its title. Any other
 * dialog type is left to RoomUI's alert (null).
 */
export function zoneNotice(type: string, message: string): IToast | null
{
    if(!type.startsWith('zone.')) return null;

    const [title, ...rest] = message.split('\n');

    return {kind: 'info', title, text: rest.join('\n'), ms: 4000};
}
