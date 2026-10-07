import type {IChildEntity} from './IChildEntity';

/**
 * Read-only view over a child-entity list.
 *
 * Obfuscated as `utils/_SafeCls_2083.as` in the primary tree; the name is
 * recovered from the unobfuscated 2016 tree.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/IChildEntityArrayReader.as
 */
export interface IChildEntityArrayReader
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/IChildEntityArrayReader.as::get numChildren()
    readonly numChildren: number;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/IChildEntityArrayReader.as::getChildAt()
    getChildAt(index: number): IChildEntity | null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/IChildEntityArrayReader.as::getChildByID()
    getChildByID(id: number): IChildEntity | null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/IChildEntityArrayReader.as::getChildByName()
    getChildByName(name: string): IChildEntity | null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/IChildEntityArrayReader.as::getChildIndex()
    getChildIndex(child: IChildEntity): number;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/IChildEntityArrayReader.as::groupChildrenWithID()
    groupChildrenWithID(id: number, result: IChildEntity[]): number;
}
