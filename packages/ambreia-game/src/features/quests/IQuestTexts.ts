import type {WindowBits} from '../../ui/kit/WindowBits';

/** The texts the quest pieces read (WindowBits in the feature, a fake in the tests). */
export type IQuestTexts = Pick<WindowBits, 'text' | 'textOr' | 'contentName'>;
