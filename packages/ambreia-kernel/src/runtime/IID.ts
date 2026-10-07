/**
 * Interface Identifier
 *
 * Based on AS3: com.sulake.core.runtime.IID
 *
 * In AS3, IID was a marker interface used to identify service interfaces.
 * In TypeScript, we use symbols for type-safe service identification.
 */

/**
 * Interface Identifier type - a unique symbol identifying a service interface
 */
export type IID<T = unknown> = symbol & { __type?: T };

/**
 * Create a new Interface Identifier
 *
 * @example
 * ```typescript
 * const IID_CommunicationManager = createIID<ICommunicationManager>('ICommunicationManager');
 * ```
 */
export function createIID<T>(name: string): IID<T>
{
    return Symbol.for(`IID:${name}`) as IID<T>;
}

/**
 * Get the name of an IID
 */
export function getIIDName(iid: IID): string
{
    const description = iid.description ?? '';

    return description.startsWith('IID:') ? description.slice(4) : description;
}
