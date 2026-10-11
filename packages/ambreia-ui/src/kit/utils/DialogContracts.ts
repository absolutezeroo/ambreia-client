import type {IDisposable} from '@ambreia/common/IDisposable';
import type {WindowEvent} from '../../events/WindowEvent';
import type {ICaption} from './AlertDialogCaption';

/** Dialog contracts live outside their concrete implementations to keep IWindowManager acyclic. */
export type AlertDialogCallback = (dialog: IDisposable, event: WindowEvent) => void;

export interface IAlertDialog extends IDisposable
{
    title: string;

    summary: string;

    callback: AlertDialogCallback | null;

    titleBarColor: number;

    getButtonCaption(buttonFlag: number): ICaption | null;

    setButtonCaption(buttonFlag: number, caption: ICaption): void;
}

export interface IAlertDialogWithLink
{
    linkTitle: string;

    linkUrl: string;
}

export type IConfirmDialog = IAlertDialog;
