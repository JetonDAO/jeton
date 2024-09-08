declare module "piesocket-js" {
  // augment the 'externalModule'
  export type Options = {
    version?: number;
    clusterId?: string;
    apiKey: string;
    consoleLogs?: boolean;
    notifySelf?: boolean;
  };

  export default class PieSocket {
    constructor(options: Options);
    subscribe(channelId: string): Promise<Channel>;
    unsubscribe(channelId: string): boolean;
  }

  export interface Channel {
    publish<T>(eventId: string, data: T): void;
    listen<T>(eventId: string, cb: (data: T, meta: string) => void): void;
  }
}
