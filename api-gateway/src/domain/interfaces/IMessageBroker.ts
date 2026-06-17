export interface IMessageBroker {
  publish(queue: string, message: unknown): Promise<void>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}
