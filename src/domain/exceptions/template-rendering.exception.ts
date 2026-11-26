export class TemplateRenderingException extends Error {
  readonly missingVariables: string[];

  constructor(missingVariables: string[]) {
    super(`Template rendering failed: Missing required variables [${missingVariables.join(', ')}]`);
    this.name = 'TemplateRenderingException';
    this.missingVariables = missingVariables;
  }
}
