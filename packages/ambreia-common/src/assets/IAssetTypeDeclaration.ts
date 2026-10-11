/**
 * Read-only declaration surface exposed by IAsset.
 * Kept independent from IAsset so AssetTypeDeclaration can still describe the
 * concrete asset constructor without creating a type cycle.
 */
export interface IAssetTypeDeclaration
{
    readonly mimeType: string;

    readonly fileTypes: string[];

    matchesExtension(extension: string): boolean;
}
