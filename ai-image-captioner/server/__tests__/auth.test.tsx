import type { ExpressAuthConfig } from '@auth/express';

jest.resetModules();

jest.mock('@auth/express', () => {
  const mockExpressAuth = jest.fn(() => 'MOCK_AUTH_HANDLER');
  return { __esModule: true, ExpressAuth: mockExpressAuth };
});

jest.mock('@auth/prisma-adapter', () => {
  const mockAdapter = jest.fn(() => ({ name: 'MOCK_PRISMA_ADAPTER' }));
  return { __esModule: true, PrismaAdapter: mockAdapter };
});

const credentialsFactoryCalls: any[] = [];
jest.mock('@auth/core/providers/credentials', () => {
  const mockCredentials = ((options: any) => {
    credentialsFactoryCalls.push(options);
    return { id: 'credentials', type: 'credentials', options };
  }) as unknown as jest.Mock;
  return { __esModule: true, default: mockCredentials };
});

jest.mock('@auth/core/providers/google', () => {
  const mockGoogle = jest.fn((opts: any) => ({ id: 'google', type: 'oauth', opts }));
  return { __esModule: true, default: mockGoogle };
});

const prismaFindFirst = jest.fn();
jest.mock('../prisma.js', () => {
  return {
    __esModule: true,
    prisma: {
      user: { findFirst: prismaFindFirst },
    },
  };
});

jest.mock('argon2', () => {
  const verify = jest.fn<Promise<boolean>, [string, string]>();
  return {
    __esModule: true,
    default: { verify },
    verify,
  };
});

describe('auth config & handler', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      AUTH_SECRET: 'test-secret',
      GOOGLE_CLIENT_ID: 'gid',
      GOOGLE_CLIENT_SECRET: 'gsecret',
      ORIGIN: 'https://frontend.example.com',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  const importAuth = () => import('../auth');

  test('ExpressAuth is called with a valid config and exports handler', async () => {
    const { ExpressAuth } = await import('@auth/express');
    const mod = await importAuth();

    expect(ExpressAuth).toHaveBeenCalledTimes(1);

    const ExpressAuthMock = ExpressAuth as unknown as jest.Mock;
    const passedConfig = ExpressAuthMock.mock.calls[0][0] as ExpressAuthConfig;

    expect(passedConfig.secret).toBe('test-secret');
    expect(passedConfig.trustHost).toBe(true);
    expect(passedConfig.session).toEqual({ strategy: 'jwt' });
    expect(Array.isArray(passedConfig.providers)).toBe(true);
    expect(passedConfig.callbacks).toBeTruthy();
    expect(typeof passedConfig.callbacks!.redirect).toBe('function');
    expect(typeof passedConfig.callbacks!.jwt).toBe('function');
    expect(typeof passedConfig.callbacks!.session).toBe('function');

    expect(mod.authHandler).toBe('MOCK_AUTH_HANDLER');
    expect(mod.authConfig).toBe(passedConfig);
  });

  describe('callbacks.redirect', () => {
    test('relative path -> FE + path', async () => {
      const { authConfig } = await importAuth();
      const FE = 'https://frontend.example.com';
      const res = await authConfig.callbacks!.redirect!({
        url: '/dashboard?x=1#y',
        baseUrl: 'https://api.example.com',
      } as any);
      expect(res).toBe(`${FE}/dashboard?x=1#y`);
    });

    test('same origin as baseUrl -> FE + u.pathname+search+hash', async () => {
      const { authConfig } = await importAuth();
      const FE = 'https://frontend.example.com';
      const res = await authConfig.callbacks!.redirect!({
        url: 'https://api.example.com/cb?ok=1#h',
        baseUrl: 'https://api.example.com',
      } as any);
      expect(res).toBe(`${FE}/cb?ok=1#h`);
    });

    test('url origin equals FE origin -> return url', async () => {
      const { authConfig } = await importAuth();
      const url = 'https://frontend.example.com/welcome?hi=1#z';
      const res = await authConfig.callbacks!.redirect!({
        url,
        baseUrl: 'https://api.example.com',
      } as any);
      expect(res).toBe(url);
    });

    test('fallback -> FE', async () => {
      const { authConfig } = await importAuth();
      const FE = 'https://frontend.example.com';
      const res = await authConfig.callbacks!.redirect!({
        url: 'https://malicious.example.net/whatever',
        baseUrl: 'https://api.example.com',
      } as any);
      expect(res).toBe(FE);
    });

    test('broken URL -> FE fallback', async () => {
      const { authConfig } = await importAuth();
      const FE = 'https://frontend.example.com';
      const res = await authConfig.callbacks!.redirect!({
        url: '::::not-a-url::::',
        baseUrl: 'https://api.example.com',
      } as any);
      expect(res).toBe(FE);
    });
  });

  describe('callbacks.jwt', () => {
    test('sets token.sub when user.id exists', async () => {
      const { authConfig } = await importAuth();
      const tokenResult = await authConfig.callbacks!.jwt!({
        token: {} as any,
        user: { id: 'u1' } as any,
      } as any);
      expect((tokenResult as any).sub).toBe('u1');
    });

    test('no change when no user', async () => {
      const { authConfig } = await importAuth();
      const tokenResult = await authConfig.callbacks!.jwt!({
        token: { a: 1 } as any,
      } as any);
      expect(tokenResult).toEqual({ a: 1 });
    });
  });

  describe('callbacks.session', () => {
    test('copies token.sub to session.user.id', async () => {
      const { authConfig } = await importAuth();
      const sessionResult = await authConfig.callbacks!.session!({
        session: { user: {} } as any,
        token: { sub: 'abc123' } as any,
      } as any);
      expect((sessionResult as any).user.id).toBe('abc123');
    });

    test('returns unchanged session if session.user is missing', async () => {
      const { authConfig } = await importAuth();
      const sessionInput = {} as any;
      const sessionResult = await authConfig.callbacks!.session!({
        session: sessionInput,
        token: { sub: 'x' } as any,
      } as any);
      expect(sessionResult).toEqual(sessionInput);
    });
  });

  describe('Credentials authorize', () => {
    const getAuthorize = async () => {
      await importAuth();
      const lastCall = credentialsFactoryCalls[credentialsFactoryCalls.length - 1];
      expect(lastCall).toBeTruthy();
      expect(typeof lastCall.authorize).toBe('function');
      return lastCall.authorize as (raw: any) => Promise<any>;
    };

    test('returns null on invalid shape (zod)', async () => {
      const authorize = await getAuthorize();
      const res = await authorize({ email: 'not-an-email', password: 'short' });
      expect(res).toBeNull();
    });

    test('returns null when user not found', async () => {
      const authorize = await getAuthorize();
      prismaFindFirst.mockResolvedValueOnce(null);
      const res = await authorize({ email: 'A@Example.com', password: 'password123' });
      expect(prismaFindFirst).toHaveBeenCalledWith({
        where: {
          email: { equals: 'a@example.com', mode: 'insensitive' },
        },
      });
      expect(res).toBeNull();
    });

    test('returns null when user has no passwordHash', async () => {
      const authorize = await getAuthorize();
      prismaFindFirst.mockResolvedValueOnce({ id: '1', email: 'a@example.com', name: 'A', passwordHash: null });
      const res = await authorize({ email: 'a@example.com', password: 'password123' });
      expect(res).toBeNull();
    });

    test('returns null when password verify fails', async () => {
      const authorize = await getAuthorize();
      const argon2 = await import('argon2');
      // Properly typed mock so booleans are accepted
      const verifyMock = argon2.verify as unknown as jest.Mock<Promise<boolean>, [string, string]>;
      prismaFindFirst.mockResolvedValueOnce({ id: '1', email: 'a@example.com', name: 'A', passwordHash: 'hash' });
      verifyMock.mockResolvedValueOnce(false);
      const res = await authorize({ email: 'a@example.com', password: 'wrongpass123' });
      expect(verifyMock).toHaveBeenCalledWith('hash', 'wrongpass123');
      expect(res).toBeNull();
    });

    test('returns { id, email, name } on success', async () => {
      const authorize = await getAuthorize();
      const argon2 = await import('argon2');
      const verifyMock = argon2.verify as unknown as jest.Mock<Promise<boolean>, [string, string]>;
      prismaFindFirst.mockResolvedValueOnce({
        id: 'user-1',
        email: 'a@example.com',
        name: 'User A',
        passwordHash: 'somehash',
      });
      verifyMock.mockResolvedValueOnce(true);
      const res = await authorize({ email: 'A@Example.com', password: 'password123' });
      expect(res).toEqual({ id: 'user-1', email: 'a@example.com', name: 'User A' });
    });
  });

  describe('logger proxies', () => {
    test('error/warn/debug call console.*', async () => {
      const spyError = jest.spyOn(console, 'error').mockImplementation(() => {});
      const spyWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const spyLog = jest.spyOn(console, 'log').mockImplementation(() => {});
      const { authConfig } = await importAuth();

      authConfig.logger!.error?.(new Error('boom') as any);
      authConfig.logger!.warn?.('warn-code' as any);
      authConfig.logger!.debug?.('debug-code' as any);

      expect(spyError).toHaveBeenCalledWith('[auth][error]', expect.any(Error));
      expect(spyWarn).toHaveBeenCalledWith('[auth][warn]', 'warn-code');
      expect(spyLog).toHaveBeenCalledWith('[auth][debug]', 'debug-code');

      spyError.mockRestore();
      spyWarn.mockRestore();
      spyLog.mockRestore();
    });
  });
});
