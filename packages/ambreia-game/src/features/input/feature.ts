import type {IGameFeature} from '../GameFeature';
import {InputBindings} from './InputBindings';

/**
 * The keyboard (UI-01): the page's one keydown listener, and the bindings the features after it
 * declare (host.made.input). Two features on one key fail the boot by name; Escape is a stack.
 */
export const InputFeature: IGameFeature = {
    id: 'input',
    create: ({host, scope}) =>
    {
        const input = new InputBindings();

        host.made.input = input;
        scope.listen(globalThis, 'keydown', (event: KeyboardEvent) => input.dispatch(event));
        scope.add(() => input.clear());
        scope.hook('input', {bindings: () => input.describe()});

        return null;
    }
};
