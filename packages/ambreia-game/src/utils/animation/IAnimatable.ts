/**
 * Interface for objects that can be animated over time.
 *
 * Implementors receive time advancement calls from a Juggler
 * to update their animation state.
 *
 * @see source_as_win63/habbo/utils/animation/class_65.as
 */
export interface IAnimatable
{
    /**
	 * Advance the animation by the given time delta.
	 *
	 * @param time The time elapsed in seconds since the last call
	 */
    advanceTime(time: number): void;
}
