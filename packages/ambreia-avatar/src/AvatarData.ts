/**
 * The avatar's static data, as shipped with the client (`src/assets/configurations/Ambreia*.xml`):
 * the text of each file, parsed by AvatarRenderManager. Ambreia ships all of it, so nothing here
 * is downloaded or looked up in an asset library under a Habbo name.
 */
export interface IAvatarData
{
    geometry: string;
    partSets: string;
    animation: string;
    actions: string;
    /** The placeholder figure set data the renderer starts with. */
    figure: string;
    /** The full figure set data, appended to `figure`. */
    figureData: string;
    /** Which library holds which part. */
    figureMap: string;
    effectMap: string;
    /** Per action state (`lay`, `swim`): where the figure is drawn in that state. */
    actionOffsets: Readonly<Record<string, string>>;
}

type AvatarDataFile = Exclude<keyof IAvatarData, 'actionOffsets'>;

/** The file each entry is read from. */
export const AVATAR_DATA_FILES: Readonly<Record<AvatarDataFile, string>> = {
    geometry: 'AmbreiaAvatarGeometry.xml',
    partSets: 'AmbreiaAvatarPartSets.xml',
    animation: 'AmbreiaAvatarAnimation.xml',
    actions: 'AmbreiaAvatarActions.xml',
    figure: 'AmbreiaAvatarFigure.xml',
    figureData: 'AmbreiaFigureData.xml',
    figureMap: 'AmbreiaFigureMap.xml',
    effectMap: 'AmbreiaEffectMap.xml'
};

export const AVATAR_ACTION_OFFSET_FILES: Readonly<Record<string, string>> = {
    lay: 'AmbreiaActionOffsetLay.xml',
    swim: 'AmbreiaActionOffsetSwim.xml'
};

/**
 * Reads every file through `read` (a bundle, the disk). A missing file throws, naming all of them:
 * the renderer cannot draw a figure without any one of them, and would otherwise wait forever.
 */
export function readAvatarData(read: (file: string) => string | null): IAvatarData
{
    const missing: string[] = [];
    const take = (file: string): string =>
    {
        const text = read(file);

        if(text === null) missing.push(file);

        return text ?? '';
    };
    const data = {} as Record<AvatarDataFile, string>;

    for(const [key, file] of Object.entries(AVATAR_DATA_FILES)) data[key as AvatarDataFile] = take(file);

    const actionOffsets: Record<string, string> = {};

    for(const [state, file] of Object.entries(AVATAR_ACTION_OFFSET_FILES)) actionOffsets[state] = take(file);

    if(missing.length > 0) throw new Error(`Missing avatar data: ${missing.join(', ')}`);

    return {...data, actionOffsets};
}
