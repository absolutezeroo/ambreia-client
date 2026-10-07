import type {PropertyStruct} from '../utils/PropertyStruct';

/**
 * Property map interface for theme defaults.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/theme/IPropertyMap.as
 */
export interface IPropertyMap
{
    getValue(key: string): unknown;

    get(key: string): PropertyStruct | null;

    setValue(key: string, value: unknown): void;

    hasValue(key: string): boolean;

    getKeys(): string[];
}
