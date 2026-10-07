/**
 * Interface for encrypted local storage.
 *
 * Provides a contract for secure string storage and retrieval.
 * Implementations may use different encryption strategies.
 *
 * @see source_as_win63/habbo/utils/IEncryptedLocalStorage.as
 */
export interface IEncryptedLocalStorage
{
    /**
	 * Reset the encrypted storage, clearing all stored data.
	 */
    reset(): void;

    /**
	 * Store a string value with the given key.
	 *
	 * @param key The storage key
	 * @param value The string value to store
	 * @returns True if the value was successfully stored
	 */
    storeString(key: string, value: string): boolean;

    /**
	 * Restore a string value by its key.
	 *
	 * @param key The storage key
	 * @returns The stored string value, or empty string if not found
	 */
    restoreString(key: string): string;
}
