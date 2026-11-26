import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { NotificationsController } from './presentation/http/controllers/notifications.controller.js';
import { TemplatesController } from './presentation/http/controllers/templates.controller.js';
import { PreferencesController } from './presentation/http/controllers/preferences.controller.js';
import { HealthController } from './infrastructure/observability/health.controller.js';
import { MetricsController } from './infrastructure/observability/metrics.controller.js';
import { MetricsService } from './infrastructure/observability/metrics.service.js';
import { PinoLoggerService } from './infrastructure/observability/pino-logger.service.js';
import { CorrelationIdMiddleware } from './presentation/http/middlewares/correlation-id.middleware.js';
import { SecurityHeadersMiddleware } from './presentation/http/middlewares/security-headers.middleware.js';

// Ports
import { TokenVerifierPort } from './application/ports/token-verifier.port.js';
import { NotificationRepositoryPort } from './application/ports/notification-repository.port.js';
import { TemplateRepositoryPort } from './application/ports/template-repository.port.js';
import { UserPreferencesRepositoryPort } from './application/ports/user-preferences-repository.port.js';
import { ProcessedEventsRepositoryPort } from './application/ports/processed-events-repository.port.js';
import { OutboxRepositoryPort } from './application/ports/outbox-repository.port.js';
import { NotificationQueuePort } from './application/ports/notification-queue.port.js';
import { EventPublisherPort } from './application/ports/event-publisher.port.js';
import { WebsocketBroadcasterPort } from './application/ports/websocket-broadcaster.port.js';

// Infrastructure & Adapters
import { JwtTokenVerifier } from './infrastructure/security/jwt-token-verifier.js';
import { MongoNotificationRepository } from './infrastructure/persistence/mongodb/repositories/mongo-notification.repository.js';
import { MongoTemplateRepository } from './infrastructure/persistence/mongodb/repositories/mongo-template.repository.js';
import { MongoUserPreferencesRepository } from './infrastructure/persistence/mongodb/repositories/mongo-user-preferences.repository.js';
import { MongoProcessedEventsRepository } from './infrastructure/persistence/mongodb/repositories/mongo-processed-events.repository.js';
import { MongoOutboxRepository } from './infrastructure/outbox/mongo-outbox.repository.js';
import { BullmqQueueService } from './infrastructure/queue/bullmq-queue.service.js';
import { RabbitmqPublisherService } from './infrastructure/messaging/rabbitmq-publisher.service.js';
import { NotificationGateway } from './infrastructure/websocket/notification.gateway.js';
import { ChannelStrategyRegistry } from './infrastructure/channels/channel-strategy.registry.js';
import { EmailChannelStrategy } from './infrastructure/channels/email/email-channel.strategy.js';
import { WebhookChannelStrategy } from './infrastructure/channels/webhook/webhook-channel.strategy.js';
import { InAppChannelStrategy } from './infrastructure/channels/in-app/in-app-channel.strategy.js';
import { NotificationWorker } from './infrastructure/queue/notification.worker.js';
import { OutboxRelayService } from './infrastructure/outbox/outbox-relay.service.js';
import { RabbitmqConsumerService } from './infrastructure/messaging/rabbitmq-consumer.service.js';

// Domain Services & Use Cases
import { TemplateEngine } from './domain/services/template-engine.js';
import { UserPreferencesPolicy } from './domain/services/user-preferences-policy.js';
import { SendNotificationUseCase } from './application/use-cases/send-notification.use-case.js';
import { GetNotificationUseCase } from './application/use-cases/get-notification.use-case.js';
import { ListUserNotificationsUseCase } from './application/use-cases/list-user-notifications.use-case.js';
import { ManageTemplateUseCase } from './application/use-cases/manage-template.use-case.js';
import { ManagePreferencesUseCase } from './application/use-cases/manage-preferences.use-case.js';

@Module({
  controllers: [
    NotificationsController,
    TemplatesController,
    PreferencesController,
    HealthController,
    MetricsController,
  ],
  providers: [
    MetricsService,
    PinoLoggerService,
    TemplateEngine,
    UserPreferencesPolicy,
    {
      provide: TokenVerifierPort,
      useClass: JwtTokenVerifier,
    },
    {
      provide: NotificationRepositoryPort,
      useClass: MongoNotificationRepository,
    },
    {
      provide: TemplateRepositoryPort,
      useClass: MongoTemplateRepository,
    },
    {
      provide: UserPreferencesRepositoryPort,
      useClass: MongoUserPreferencesRepository,
    },
    {
      provide: ProcessedEventsRepositoryPort,
      useClass: MongoProcessedEventsRepository,
    },
    {
      provide: OutboxRepositoryPort,
      useClass: MongoOutboxRepository,
    },
    {
      provide: NotificationQueuePort,
      useClass: BullmqQueueService,
    },
    {
      provide: EventPublisherPort,
      useClass: RabbitmqPublisherService,
    },
    NotificationGateway,
    {
      provide: WebsocketBroadcasterPort,
      useExisting: NotificationGateway,
    },
    EmailChannelStrategy,
    WebhookChannelStrategy,
    {
      provide: InAppChannelStrategy,
      useFactory: (gateway: NotificationGateway) => new InAppChannelStrategy(gateway),
      inject: [NotificationGateway],
    },
    {
      provide: ChannelStrategyRegistry,
      useFactory: (
        email: EmailChannelStrategy,
        webhook: WebhookChannelStrategy,
        inApp: InAppChannelStrategy,
      ) => new ChannelStrategyRegistry([email, webhook, inApp]),
      inject: [EmailChannelStrategy, WebhookChannelStrategy, InAppChannelStrategy],
    },
    {
      provide: SendNotificationUseCase,
      useFactory: (
        notifRepo: NotificationRepositoryPort,
        queue: NotificationQueuePort,
        prefsRepo: UserPreferencesRepositoryPort,
        policy: UserPreferencesPolicy,
      ) => new SendNotificationUseCase(notifRepo, queue, prefsRepo, policy),
      inject: [
        NotificationRepositoryPort,
        NotificationQueuePort,
        UserPreferencesRepositoryPort,
        UserPreferencesPolicy,
      ],
    },
    {
      provide: GetNotificationUseCase,
      useFactory: (notifRepo: NotificationRepositoryPort) => new GetNotificationUseCase(notifRepo),
      inject: [NotificationRepositoryPort],
    },
    {
      provide: ListUserNotificationsUseCase,
      useFactory: (notifRepo: NotificationRepositoryPort) =>
        new ListUserNotificationsUseCase(notifRepo),
      inject: [NotificationRepositoryPort],
    },
    {
      provide: ManageTemplateUseCase,
      useFactory: (templateRepo: TemplateRepositoryPort) =>
        new ManageTemplateUseCase(templateRepo),
      inject: [TemplateRepositoryPort],
    },
    {
      provide: ManagePreferencesUseCase,
      useFactory: (prefsRepo: UserPreferencesRepositoryPort) =>
        new ManagePreferencesUseCase(prefsRepo),
      inject: [UserPreferencesRepositoryPort],
    },
    {
      provide: NotificationWorker,
      useFactory: (
        notifRepo: NotificationRepositoryPort,
        templateRepo: TemplateRepositoryPort,
        engine: TemplateEngine,
        strategies: ChannelStrategyRegistry,
        outboxRepo: OutboxRepositoryPort,
      ) => {
        const host = process.env.REDIS_HOST ?? 'localhost';
        const port = parseInt(process.env.REDIS_PORT ?? '6380', 10);
        return new NotificationWorker(notifRepo, templateRepo, engine, strategies, outboxRepo, {
          host,
          port,
        });
      },
      inject: [
        NotificationRepositoryPort,
        TemplateRepositoryPort,
        TemplateEngine,
        ChannelStrategyRegistry,
        OutboxRepositoryPort,
      ],
    },
    {
      provide: OutboxRelayService,
      useFactory: (outboxRepo: OutboxRepositoryPort, publisher: EventPublisherPort) => {
        return new OutboxRelayService(outboxRepo, publisher);
      },
      inject: [OutboxRepositoryPort, EventPublisherPort],
    },
    {
      provide: RabbitmqConsumerService,
      useFactory: (
        processedRepo: ProcessedEventsRepositoryPort,
        sendUseCase: SendNotificationUseCase,
      ) => {
        return new RabbitmqConsumerService(processedRepo, sendUseCase);
      },
      inject: [ProcessedEventsRepositoryPort, SendNotificationUseCase],
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware, SecurityHeadersMiddleware).forRoutes('*');
  }
}
