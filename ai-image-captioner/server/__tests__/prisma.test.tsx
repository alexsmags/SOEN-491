type PrismaCtorArg = { log?: string[] } | undefined;

jest.mock('@prisma/client', () => {
  const PrismaClient = jest.fn<any, [PrismaCtorArg?]>((opts?: PrismaCtorArg) => {
    return { __mockId: Symbol('prisma-instance'), _opts: opts };
  });

  return {
    __esModule: true,
    PrismaClient,
  };
});

const importPrismaModuleIsolated = async () => {
  let mod: any;
  if ((jest as any).isolateModulesAsync) {
    await (jest as any).isolateModulesAsync(async () => {
      mod = await import('../prisma');
    });
  } else {
    jest.isolateModules(() => {
      mod = require('../prisma');
    });
  }
  return mod;
};

describe('server/prisma.ts', () => {
  const originalEnv = process.env;
  const g = globalThis as any;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, NODE_ENV: 'test' };
    delete g.prisma;
  });

  afterAll(() => {
    process.env = originalEnv;
    delete g.prisma;
  });

  test('constructs PrismaClient with expected log options', async () => {
    const { prisma } = await importPrismaModuleIsolated();

    expect(typeof prisma).toBe('object');
    expect((prisma as any).__mockId).toBeDefined();
    expect((prisma as any)._opts).toEqual({ log: ['error', 'warn'] });
  });

  test('dev mode: caches instance on globalThis and reuses across reloads', async () => {
    const first = await importPrismaModuleIsolated();
    const firstInstance = first.prisma;

    expect((globalThis as any).prisma).toBe(firstInstance);

    const second = await importPrismaModuleIsolated();
    const secondInstance = second.prisma;

    expect(secondInstance).toBe(firstInstance);
    expect((globalThis as any).prisma).toBe(secondInstance);
  });

  test('production mode: does not cache on globalThis, creates new instance per load', async () => {
    process.env.NODE_ENV = 'production';
    delete (globalThis as any).prisma;

    const first = await importPrismaModuleIsolated();
    const firstInstance = first.prisma;

    expect((globalThis as any).prisma).toBeUndefined();

    const second = await importPrismaModuleIsolated();
    const secondInstance = second.prisma;

    expect(secondInstance).not.toBe(firstInstance);
    expect((globalThis as any).prisma).toBeUndefined();
  });
});
