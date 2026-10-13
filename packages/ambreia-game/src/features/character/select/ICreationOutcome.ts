/**
 * What the characters screen does with an answer to the wizard: `classing` the character exists and
 * its class is asked; `refused` the wizard takes it back (an alert when its name step cannot show
 * it); `done` the wizard closes, on the character, saying a refusal if there was one; `ignored` not
 * the wizard's answer.
 */
export type ICreationOutcome =
    | {readonly kind: 'classing'; readonly playerId: number}
    | {readonly kind: 'refused'; readonly code: string; readonly alert: boolean}
    | {readonly kind: 'done'; readonly playerId: number; readonly refusal: string | null}
    | {readonly kind: 'ignored'};
