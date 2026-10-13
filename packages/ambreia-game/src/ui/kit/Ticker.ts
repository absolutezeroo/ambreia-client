/** A repeating timer a feature's scope owns (`scope.interval`), handed to the views that count down. */
export type Ticker = (run: () => void, ms: number) => {clear(): void};
