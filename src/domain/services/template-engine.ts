import { Template } from '../entities/template.entity.js';
import { TemplateRenderingException } from '../exceptions/template-rendering.exception.js';

export interface RenderedTemplate {
  subject: string;
  body: string;
}

export class TemplateEngine {
  private static readonly VARIABLE_REGEX = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;

  render(template: Template, data: Record<string, unknown>): RenderedTemplate {
    const subjectPlaceholders = this.extractPlaceholders(template.subject);
    const bodyPlaceholders = this.extractPlaceholders(template.bodyTemplate);

    const allPlaceholders = Array.from(new Set([...subjectPlaceholders, ...bodyPlaceholders]));
    const missingVariables: string[] = [];

    for (const key of allPlaceholders) {
      if (data[key] === undefined || data[key] === null) {
        missingVariables.push(key);
      }
    }

    if (missingVariables.length > 0) {
      throw new TemplateRenderingException(missingVariables);
    }

    const renderedSubject = this.replacePlaceholders(template.subject, data);
    const renderedBody = this.replacePlaceholders(template.bodyTemplate, data);

    return {
      subject: renderedSubject,
      body: renderedBody,
    };
  }

  private extractPlaceholders(text: string): string[] {
    const keys: string[] = [];
    let match: RegExpExecArray | null;
    const regex = new RegExp(TemplateEngine.VARIABLE_REGEX.source, 'g');
    while ((match = regex.exec(text)) !== null) {
      keys.push(match[1]);
    }
    return keys;
  }

  private replacePlaceholders(text: string, data: Record<string, unknown>): string {
    return text.replace(TemplateEngine.VARIABLE_REGEX, (_, key: string) => {
      const val = data[key];
      return String(val);
    });
  }
}
