/** @type {import('dependency-cruiser').IConfiguration} */
export default {
  forbidden: [
    {
      name: 'domain-no-external-or-higher-layers',
      comment: 'Domain layer must not depend on Application, Infrastructure, Presentation, or framework libraries',
      severity: 'error',
      from: { path: '^src/domain' },
      to: {
        path: '^(src/(application|infrastructure|presentation)|node_modules/(@nestjs|mongoose|bullmq|ioredis|amqplib|socket.io|nodemailer|axios))',
      },
    },
    {
      name: 'application-no-infrastructure-or-presentation',
      comment: 'Application layer must not depend on Infrastructure or Presentation layers',
      severity: 'error',
      from: { path: '^src/application' },
      to: {
        path: '^src/(infrastructure|presentation)',
      },
    },
    {
      name: 'no-circular-dependencies',
      comment: 'Circular dependencies are forbidden',
      severity: 'error',
      from: {},
      to: {
        circular: true,
      },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: 'tsconfig.json',
    },
  },
};
