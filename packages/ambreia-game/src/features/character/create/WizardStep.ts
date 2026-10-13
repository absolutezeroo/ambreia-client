/** The wizard's steps, in the mock-up's order (vortex_character_create_xml's step list). */
export const WIZARD_STEPS = ['class', 'appearance', 'name', 'confirm'] as const;

export type WizardStep = typeof WIZARD_STEPS[number];
