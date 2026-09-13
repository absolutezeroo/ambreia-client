// The nine security questions, and habbo.com builds the list exactly this way:
//
//   .constant("QUESTIONS", _.range(1, 10).map(function (n) {
//       return { questionId: n.toString(), questionKey: "IDENTITY_SAFETYQUESTION_" + n }
//   }))
//
// A question is a NUMBER everywhere it travels — in the select, on the wire, in the database — and
// a key everywhere it is read. That is what lets the pair an account chose in French read in any
// other language later, and it is why the server stores 1..9 rather than a sentence.
import {t} from './i18n.js';

export const SAFETY_QUESTION_COUNT = 9;

export interface ISafetyQuestion
{
    id: number;
    label: string;
}

/**
 * The list for one of the two selects. habbo.com filters it through its own `question:` filter,
 * which drops whichever question the OTHER select is showing — the pair has to be two different
 * questions, and the server refuses a request where it is not.
 */
export function questionsExcept(taken: number): ISafetyQuestion[]
{
    const all: ISafetyQuestion[] = [];

    for(let id = 1; id <= SAFETY_QUESTION_COUNT; id++)
    {
        if(id !== taken)
        {
            all.push({id, label: t(`IDENTITY_SAFETYQUESTION_${id}`)});
        }
    }

    return all;
}

/** One question's wording, for the challenge dialog's two labels. */
export function questionLabel(id: number): string
{
    return id >= 1 && id <= SAFETY_QUESTION_COUNT ? t(`IDENTITY_SAFETYQUESTION_${id}`) : '';
}
