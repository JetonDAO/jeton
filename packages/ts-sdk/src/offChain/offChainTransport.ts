export interface offChainTransport {
  create(channelId: string): Promise<void>;
  publish<T>(eventId: string, data: T): void;
  subscribe<T>(eventId: string, callback: (data: T) => void): void;
  close(): void;
}
