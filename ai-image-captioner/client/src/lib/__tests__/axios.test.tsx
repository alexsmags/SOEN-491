import { api } from '../axios';
import { vi, describe, it, expect } from 'vitest';

vi.mock('../axios', () => ({
  api: {
    get: vi.fn(),
  },
}));

describe('API test suite', () => {
  it('should call the API and return data', async () => {
    const mockResponse = { data: { message: 'Success' } };

    (api.get as vi.Mock).mockResolvedValueOnce(mockResponse);

    const response = await api.get('/test-url');
    
    expect(response.data.message).toBe('Success');
    expect(api.get).toHaveBeenCalledWith('/test-url');
  });
});
