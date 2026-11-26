export interface WebsocketBroadcasterPort {
  sendToUser(userId: string, event: string, payload: unknown): Promise<boolean>;
}

export const WebsocketBroadcasterPort = Symbol('WebsocketBroadcasterPort');
