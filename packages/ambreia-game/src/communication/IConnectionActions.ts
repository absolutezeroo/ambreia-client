import type {HabboCommunicationEventType} from './enum/HabboCommunicationEvent';

export interface IConnectionActions
{
    setConnecting(): void;

    setConnected(): void;

    setAuthenticated(): void;

    setDisconnected(): void;

    setError(message: string): void;

    setLoginStep(step: HabboCommunicationEventType): void;

    reset(): void;
}
