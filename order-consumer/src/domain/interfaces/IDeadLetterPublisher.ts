export interface IDeadLetterPublisher {
  publish(message: unknown, reason: string): Promise<void>;
}
