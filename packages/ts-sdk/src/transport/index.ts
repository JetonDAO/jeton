import PieSocket, { type Channel } from "piesocket-js";

export class PieSocketTransport {
  private pieSocket: PieSocket;
  private channel?: Channel;
  private channelId?: string | null;
  constructor() {
    this.pieSocket = new PieSocket({
      clusterId: "demo",
      apiKey: process.env.PIESOCKET_API_KEY || "",
      notifySelf: false,
    });
  }

  async create(channelId: string) {
    if (this.channelId) throw new Error("Already created");
    this.channelId = channelId;
    this.channel = await this.pieSocket.subscribe(channelId);
  }

  publish<T>(eventId: string, data: T) {
    if (!this.channel) throw new Error("You must first call create");

    this.channel.publish(eventId, data);
  }

  subscribe<T>(eventId: string, callback: (data: T) => void) {
    if (!this.channel) throw new Error("You must first call create");

    this.channel.listen(eventId, (data: T, meta: string) => {
      callback(data);
    });
  }

  close() {
    if (!this.channelId) throw new Error("attempted to close before create");
    this.pieSocket.unsubscribe(this.channelId);
    this.channelId = null;
  }
}
