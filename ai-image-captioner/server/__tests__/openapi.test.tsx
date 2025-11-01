const dotenvConfigMock = jest.fn();
jest.mock('dotenv', () => ({
  __esModule: true,
  default: { config: dotenvConfigMock },
}));

const importSpec = async () => {
  jest.resetModules();
  return import('../openapi'); 
};

describe('openapiSpec module', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('calls dotenv.config and exports a spec object', async () => {
    const mod = await importSpec();
    expect(dotenvConfigMock).toHaveBeenCalledTimes(1);
    expect(mod).toHaveProperty('openapiSpec');
    expect(typeof mod.openapiSpec).toBe('object');
  });

  describe('servers url resolution', () => {
    test('uses BASE_URL and trims trailing slash', async () => {
      process.env.BASE_URL = 'https://api.example.com/';
      process.env.PORT = '7777';
      const { openapiSpec } = await importSpec();

      expect(openapiSpec.servers?.[0]?.url).toBe('https://api.example.com');
    });

    test('falls back to http://localhost:PORT when BASE_URL is not set', async () => {
      delete process.env.BASE_URL;
      process.env.PORT = '5050';
      const { openapiSpec } = await importSpec();

      expect(openapiSpec.servers?.[0]?.url).toBe('http://localhost:5050');
    });

    test('falls back to default port 5000 when neither BASE_URL nor PORT is set', async () => {
      delete process.env.BASE_URL;
      delete process.env.PORT;
      const { openapiSpec } = await importSpec();

      expect(openapiSpec.servers?.[0]?.url).toBe('http://localhost:5000');
    });
  });

  describe('top-level OpenAPI fields', () => {
    test('has expected openapi, info, tags, components, paths', async () => {
      const { openapiSpec } = await importSpec();

      expect(openapiSpec.openapi).toBe('3.0.3');
      expect(openapiSpec.info).toMatchObject({
        title: 'Media API',
        version: '1.0.0',
      });

      const tagNames = (openapiSpec.tags ?? []).map((t: any) => t.name).sort();
      expect(tagNames).toEqual(['auth', 'health', 'media'].sort());

      expect(openapiSpec).toHaveProperty('components');
      expect(openapiSpec).toHaveProperty('paths');
      expect(openapiSpec.security).toEqual([{ DevUserId: [] }]);
    });
  });

  describe('components.securitySchemes', () => {
    test('has DevUserId apiKey header', async () => {
      const { openapiSpec } = await importSpec();

      const scheme = openapiSpec.components?.securitySchemes?.DevUserId;
      expect(scheme).toMatchObject({
        type: 'apiKey',
        in: 'header',
        name: 'x-user-id',
      });
      expect(typeof scheme.description).toBe('string');
    });
  });

  describe('components.schemas', () => {
    test('Media schema shape', async () => {
      const { openapiSpec } = await importSpec();

      const Media = openapiSpec.components?.schemas?.Media;
      expect(Media?.type).toBe('object');

      const required = new Set(Media?.required ?? []);
      [
        'id',
        'imageUrl',
        'caption',
        'createdAt',
        'updatedAt',
        'fontFamily',
        'fontSize',
        'textColor',
        'align',
        'showBg',
        'bgColor',
        'bgOpacity',
        'posX',
        'posY',
      ].forEach((k) => expect(required.has(k)).toBe(true));

      expect(Media.properties?.imageUrl).toMatchObject({ type: 'string', format: 'uri' });
      expect(Media.properties?.align?.enum).toEqual(['left', 'center', 'right']);
      expect(Media.properties?.showBg?.type).toBe('boolean');
      expect(Media.properties?.bgOpacity?.type).toBe('number');
      expect(Media.properties?.createdAt?.format).toBe('date-time');
    });

    test('MediaList schema references Media and has pagination fields', async () => {
      const { openapiSpec } = await importSpec();

      const MediaList = openapiSpec.components?.schemas?.MediaList;
      expect(MediaList?.type).toBe('object');

      const required = new Set(MediaList?.required ?? []);
      ['items', 'total', 'page', 'pageSize'].forEach((k) =>
        expect(required.has(k)).toBe(true),
      );

      expect(MediaList?.properties?.items?.items).toEqual({
        $ref: '#/components/schemas/Media',
      });
      expect(MediaList?.properties?.total?.type).toBe('integer');
    });

    test('Error schema has error and path', async () => {
      const { openapiSpec } = await importSpec();

      const ErrorSchema = openapiSpec.components?.schemas?.Error;
      expect(ErrorSchema?.type).toBe('object');
      expect(ErrorSchema?.properties?.error?.type).toBe('string');
      expect(ErrorSchema?.properties?.path?.type).toBe('string');
    });
  });

  describe('paths', () => {
    test('/health GET response shape', async () => {
      const { openapiSpec } = await importSpec();

      const op = openapiSpec.paths?.['/health']?.get;
      expect(op?.tags).toContain('health');
      expect(op?.responses?.['200']?.content?.['application/json']?.schema).toMatchObject({
        type: 'object',
        properties: { ok: { type: 'boolean' } },
      });
      expect(op?.responses?.['200']?.content?.['application/json']?.example).toEqual({ ok: true });
    });

    test('/api/me GET responses (200, 401)', async () => {
      const { openapiSpec } = await importSpec();

      const op = openapiSpec.paths?.['/api/me']?.get;
      expect(op?.tags).toContain('auth');
      expect(op?.responses?.['200']?.content?.['application/json']?.schema).toMatchObject({
        type: 'object',
        properties: { user: { type: 'object' } },
      });
      expect(op?.responses?.['401']?.content?.['application/json']?.schema).toEqual({
        $ref: '#/components/schemas/Error',
      });
    });

    test('/api/media POST request body (multipart) and 200/400/401 responses', async () => {
      const { openapiSpec } = await importSpec();

      const postOp = openapiSpec.paths?.['/api/media']?.post;
      expect(postOp?.tags).toContain('media');
      const schema = postOp?.requestBody?.content?.['multipart/form-data']?.schema;

      expect(schema?.required).toContain('file');
      expect(schema?.properties?.file?.format).toBe('binary');

      expect(schema?.properties?.caption?.default).toBe('');
      expect(schema?.properties?.fontFamily?.default).toBe('Arial');

      expect(schema?.properties?.showBg?.type).toBe('string');

      expect(postOp?.responses?.['200']?.content?.['application/json']?.schema).toEqual({
        $ref: '#/components/schemas/Media',
      });
      expect(postOp?.responses?.['400']?.description).toMatch(/Bad request/i);
      expect(postOp?.responses?.['401']?.description).toMatch(/Unauthorized/i);
    });

    test('/api/media GET query params and 200/401 responses', async () => {
      const { openapiSpec } = await importSpec();

      const getOp = openapiSpec.paths?.['/api/media']?.get;
      expect(getOp?.tags).toContain('media');

      const params = (getOp?.parameters ?? []).reduce((acc: Record<string, any>, p: any) => {
        acc[p.name] = p;
        return acc;
      }, {});

      expect(params.tone?.in).toBe('query');
      expect(params.keyword?.description).toMatch(/alias: q/i);
      expect(params.page?.schema?.default).toBe(1);
      expect(params.pageSize?.schema?.default).toBe(24);

      expect(getOp?.responses?.['200']?.content?.['application/json']?.schema).toEqual({
        $ref: '#/components/schemas/MediaList',
      });
      expect(getOp?.responses?.['401']?.description).toMatch(/Unauthorized/i);
    });

    test('/api/media/{id} GET/PUT/DELETE exist and reference Media/Error', async () => {
      const { openapiSpec } = await importSpec();

      const pathItem = openapiSpec.paths?.['/api/media/{id}'];
      expect(pathItem?.get?.tags).toContain('media');
      expect(pathItem?.put?.tags).toContain('media');
      expect(pathItem?.delete?.tags).toContain('media');

      expect(
        pathItem?.get?.responses?.['200']?.content?.['application/json']?.schema,
      ).toEqual({ $ref: '#/components/schemas/Media' });
      expect(pathItem?.get?.responses?.['404']?.description).toMatch(/Not found/i);

      expect(
        pathItem?.put?.responses?.['200']?.content?.['application/json']?.schema,
      ).toEqual({ $ref: '#/components/schemas/Media' });

      expect(
        pathItem?.delete?.responses?.['200']?.content?.['application/json']?.schema,
      ).toMatchObject({
        type: 'object',
        properties: { ok: { type: 'boolean' } },
      });
    });
  });
});
