import { ChannelStrategyPort } from '../../application/ports/channel-strategy.port.js';
import { NotificationChannel } from '../../domain/enums/notification-channel.enum.js';

export class ChannelStrategyRegistry {
  private readonly strategies = new Map<NotificationChannel, ChannelStrategyPort>();

  constructor(strategies: ChannelStrategyPort[] = []) {
    for (const strategy of strategies) {
      this.register(strategy);
    }
  }

  register(strategy: ChannelStrategyPort): void {
    this.strategies.set(strategy.channel, strategy);
  }

  get(channel: NotificationChannel): ChannelStrategyPort {
    const strategy = this.strategies.get(channel);
    if (!strategy) {
      throw new Error(`No delivery strategy registered for channel: ${channel}`);
    }
    return strategy;
  }
}
