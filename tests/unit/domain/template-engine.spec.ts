// tests/unit/domain/template-engine.spec.ts
import { describe, it, expect } from 'vitest';
import { TemplateEngine } from '../../../src/domain/services/template-engine.js';
import { Template } from '../../../src/domain/entities/template.entity.js';
import { NotificationChannel } from '../../../src/domain/enums/notification-channel.enum.js';
import { TemplateRenderingException } from '../../../src/domain/exceptions/template-rendering.exception.js';

describe('TemplateEngine', () => {
  it('renders variables and throws TemplateRenderingException when variable is missing', () => {
    const engine = new TemplateEngine();
    const template = Template.create({
      key: 'transfer.completed',
      channel: NotificationChannel.EMAIL,
      subject: 'Transfer of {{amount}} {{currency}} completed',
      bodyTemplate: 'Hello {{name}}, your transfer of {{amount}} {{currency}} succeeded.',
    });

    const rendered = engine.render(template, { name: 'Alice', amount: '100.00', currency: 'BRL' });
    expect(rendered.subject).toBe('Transfer of 100.00 BRL completed');
    expect(rendered.body).toBe('Hello Alice, your transfer of 100.00 BRL succeeded.');

    // Review Focus #2 Test: missing currency
    expect(() => engine.render(template, { name: 'Alice', amount: '100.00' }))
      .toThrow(TemplateRenderingException);
  });

  it('reports the exact missing variables in TemplateRenderingException', () => {
    const engine = new TemplateEngine();
    const template = Template.create({
      key: 'welcome',
      channel: NotificationChannel.EMAIL,
      subject: 'Welcome, {{name}}!',
      bodyTemplate: 'Your activation code is {{code}}.',
    });

    try {
      engine.render(template, {});
      expect.fail('Should have thrown TemplateRenderingException');
    } catch (err) {
      expect(err).toBeInstanceOf(TemplateRenderingException);
      const tre = err as TemplateRenderingException;
      expect(tre.missingVariables).toEqual(expect.arrayContaining(['name', 'code']));
    }
  });
});
