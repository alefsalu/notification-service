import { Template } from '../../domain/entities/template.entity.js';

export interface TemplateRepositoryPort {
  save(template: Template): Promise<void>;
  findByKey(key: string): Promise<Template | null>;
  findAll(): Promise<Template[]>;
}

export const TemplateRepositoryPort = Symbol('TemplateRepositoryPort');
