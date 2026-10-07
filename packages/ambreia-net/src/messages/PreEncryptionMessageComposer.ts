import {MessageComposer} from './MessageComposer';

/**
 * Base class for messages allowed before socket encryption is active.
 *
 * AS3 uses an empty `IPreEncryptionMessage` interface and checks it at runtime.
 * TypeScript interfaces are erased, so this class provides the same runtime
 * marker through inheritance.
 *
 * @see sources/win63_version/core/communication/messages/IPreEncryptionMessage.as
 */
export abstract class PreEncryptionMessageComposer<T extends unknown[] = unknown[]> extends MessageComposer<T>
{
}
