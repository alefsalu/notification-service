import { TemplateRepositoryPort } from '../../../../application/ports/template-repository.port.js';
import { Template } from '../../../../domain/entities/template.entity.js';
import { TemplateModel, TemplateDocument } from '../schemas/template.schema.js';

export class MongoTemplateRepository implements TemplateRepositoryPort {
  async save(template: Template): Promise<void> {
    await TemplateModel.findByIdAndUpdate(
      template.key,
      {
        $set: {
          key: template.key,
          channel: template.channel,
          subject: template.subject,
          bodyTemplate: template.bodyTemplate,
          updatedAt: template.updatedAt,
        },
        $setOnInsert: {
          _id: template.key,
          createdAt: template.createdAt,
        },
      },
      { upsert: true, new: true },
    );
  }

  async findByKey(key: string): Promise<Template | null> {
    const doc = await TemplateModel.findById(key).exec();
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async findAll(): Promise<Template[]> {
    const docs = await TemplateModel.find().exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  private toDomain(doc: TemplateDocument): Template {
    return Template.reconstitute({
      key: doc.key,
      channel: doc.channel,
      subject: doc.subject,
      bodyTemplate: doc.bodyTemplate,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
