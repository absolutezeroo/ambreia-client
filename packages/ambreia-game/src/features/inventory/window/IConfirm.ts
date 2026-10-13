/** Asks the player to confirm (the window manager's confirm dialog); the answer is a WE_OK or a WE_CANCEL. */
export type IConfirm = (title: string, text: string, onAnswer: (dialog: {dispose(): void}, event: {type: string}) => void) => void;
