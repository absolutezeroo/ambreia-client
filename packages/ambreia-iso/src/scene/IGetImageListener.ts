/**
 * Receiver for asynchronous room-object image/icon requests.
 *
 * AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/IGetImageListener.as
 * (real class name recovered from PRODUCTION-201601012205-226667486; win63 decompiles this as class_1829)
 */
export interface IGetImageListener {
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/IGetImageListener.as::imageReady()
    imageReady(id: number, data: ImageBitmap | null): void;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/IGetImageListener.as::imageFailed()
    imageFailed(id: number): void;
}
