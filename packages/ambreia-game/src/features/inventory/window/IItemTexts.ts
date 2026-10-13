import type {WindowBits} from '../../../ui/kit/WindowBits';

/** The texts an item's lines are read from (WindowBits in the window, a fake in the tests). */
export type IItemTexts = Pick<WindowBits, 'text' | 'contentName'>;
