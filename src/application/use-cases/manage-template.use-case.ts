import { TemplateRepositoryPort } from '../ports/template-repository.port.js';
import { Template } from '../../domain/entities/template.entity.js';
import { NotificationChannel } from '../../domain/enums/notification-channel.enum.js';

export interface CreateTemplateCommand {
  key: string;
  channel: NotificationChannel;
  subject: string;
  bodyTemplate: string;
}

export class ManageTemplateUseCase {
  constructor(private readonly templateRepository: TemplateRepositoryPort) {}

  async create(command: CreateTemplateCommand): Promise<Template> {
    const existing = await this.templateRepository.findByKey(command.key);
    if (existing) {
      throw new Error(`Template already exists with key: ${command.key}`);
    }

    const template = Template.create({
      key: command.key,
      channel: command.channel,
      subject: command.subject,
      bodyTemplate: command.bodyTemplate,
    });

    await this.templateRepository.save(template);
    return template;
  }

  async update(key: string, subject: string, bodyTemplate: string): Promise<Template> {
    const template = await this.templateRepository.findByKey(key);
    if (!template) {
      throw new Error(`Template not found with key: ${key}`);
    }

    template.update(subject, bodyTemplate);
    await this.templateRepository.save(template);
    return template;
  }

  async getByKey(key: string): Promise<Template | null> {
    return this.templateRepository.findByKey(key);
  }

  async listAll(): Promise<Template[]> {
    return this.templateRepository.findAll();
  }
}
