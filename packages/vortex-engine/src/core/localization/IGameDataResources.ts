/**
 * Interface for game data resources (hashes for external files)
 *
 * Based on AS3 sources/win63_version/core/localization/class_1959.as
 */
// AS3: sources/win63_version/core/localization/class_1959.as::class_1959()
export interface IGameDataResources
{
    // AS3: sources/win63_version/core/localization/class_1959.as::getExternalTextsUrl()
    readonly externalTextsUrl: string;
    // AS3: sources/win63_version/core/localization/class_1959.as::getExternalTextsHash()
    readonly externalTextsHash: string;
    // AS3: sources/win63_version/core/localization/class_1959.as::getExternalVariablesUrl()
    readonly externalVariablesUrl: string;
    // AS3: sources/win63_version/core/localization/class_1959.as::getExternalVariablesHash()
    readonly externalVariablesHash: string;
    // AS3: sources/win63_version/core/localization/class_1959.as::getFurniDataUrl()
    readonly furniDataUrl: string;
    // AS3: sources/win63_version/core/localization/class_1959.as::getFurniDataHash()
    readonly furniDataHash: string;
    // AS3: sources/win63_version/core/localization/class_1959.as::getProductDataUrl()
    readonly productDataUrl: string;
    // AS3: sources/win63_version/core/localization/class_1959.as::getProductDataHash()
    readonly productDataHash: string;

    /**
	 * Check if all required AS3 resources are present
	 */
    // AS3: sources/win63_version/core/localization/class_1959.as::isValid()
    isValid(): boolean;

    /**
	 * Any resource in the manifest, by the name it was published under — the named pairs above are
	 * the four the client always needs, these reach the rest.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/localization/IGameDataResources.as::getResourceUrl()
    getResourceUrl(name: string): string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/localization/IGameDataResources.as::getResourceHash()
    getResourceHash(name: string): string;
}