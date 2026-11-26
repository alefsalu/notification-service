import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import mongoose from 'mongoose';
import { AppModule } from './app.module.js';
import { Rfc7807ExceptionFilter } from './presentation/http/filters/rfc7807-exception.filter.js';
import { RedisIoAdapter } from './infrastructure/websocket/redis-io.adapter.js';
import { OutboxRelayService } from './infrastructure/outbox/outbox-relay.service.js';
import { RabbitmqConsumerService } from './infrastructure/messaging/rabbitmq-consumer.service.js';

async function bootstrap() {
  const mongoUri =
    process.env.MONGODB_URI ?? 'mongodb://localhost:27018/notification_db?replicaSet=rs0';
  await mongoose.connect(mongoUri);

  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:8088'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new Rfc7807ExceptionFilter());

  // WebSocket adapter with Redis
  const redisIoAdapter = new RedisIoAdapter(app);
  try {
    await redisIoAdapter.connectToRedis();
    app.useWebSocketAdapter(redisIoAdapter);
  } catch (err) {
    console.warn('Could not connect RedisIoAdapter, falling back to default socket adapter:', err);
  }

  // Start background services
  const relay = app.get(OutboxRelayService);
  relay.start(1000);

  const consumer = app.get(RabbitmqConsumerService);
  try {
    await consumer.start();
  } catch (err) {
    console.warn('Could not start RabbitMQ consumer initially:', err);
  }

  app.enableShutdownHooks();

  const port = process.env.PORT ?? 8082;
  await app.listen(port);
  console.log(`Notification service listening on port ${port}`);
}

bootstrap().catch((err) => {
  console.error('Fatal error during bootstrap:', err);
  process.exit(1);
});
