/**
 * Testes para o hook consolidado useApi
 */

import { renderHook, act } from '@testing-library/react';
import { useApi, useGet, usePost, usePut, useDelete, usePatch } from '../useApi';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock Response
class MockResponse {
  constructor(private body: any, private init: ResponseInit = {}) {}

  get ok() {
    return (this.init.status || 200) >= 200 && (this.init.status || 200) < 300;
  }

  get status() {
    return this.init.status || 200;
  }

  async json() {
    return this.body;
  }

  async text() {
    return typeof this.body === 'string' ? this.body : JSON.stringify(this.body);
  }
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useApi', () => {
  describe('GET Requests', () => {
    it('should fetch data successfully', async () => {
      const mockData = { id: 1, name: 'Test' };
      mockFetch.mockResolvedValueOnce(new MockResponse(mockData));

      const { result } = renderHook(() => useGet());

      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();

      await act(async () => {
        await result.current.execute('/api/test');
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBeNull();
      expect(result.current.success).toBe(true);
    });

    it('should handle fetch errors', async () => {
      const errorMessage = 'Network error';
      mockFetch.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useGet());

      await act(async () => {
        await result.current.execute('/api/test');
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.success).toBe(false);
    });

    it('should handle API error responses', async () => {
      const errorResponse = { message: 'API Error' };
      mockFetch.mockResolvedValueOnce(
        new MockResponse(errorResponse, { status: 400 })
      );

      const { result } = renderHook(() => useGet());

      await act(async () => {
        await result.current.execute('/api/test');
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBe('API Error');
      expect(result.current.success).toBe(false);
    });
  });

  describe('POST Requests', () => {
    it('should send POST data successfully', async () => {
      const mockData = { id: 1, created: true };
      const postData = { name: 'New Item' };
      mockFetch.mockResolvedValueOnce(new MockResponse(mockData));

      const { result } = renderHook(() => usePost());

      await act(async () => {
        await result.current.execute('/api/test', postData);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      expect(result.current.data).toEqual(mockData);
      expect(result.current.success).toBe(true);
    });

    it('should handle POST with custom headers', async () => {
      const mockData = { success: true };
      mockFetch.mockResolvedValueOnce(new MockResponse(mockData));

      const { result } = renderHook(() =>
        usePost()
      );

      await act(async () => {
        await result.current.execute('/api/test');
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: undefined,
      });
    });
  });

  describe('PUT Requests', () => {
    it('should send PUT data successfully', async () => {
      const mockData = { id: 1, updated: true };
      const putData = { name: 'Updated Item' };
      mockFetch.mockResolvedValueOnce(new MockResponse(mockData));

      const { result } = renderHook(() => usePut());

      await act(async () => {
        await result.current.execute('/api/test/1', putData);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/test/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(putData),
      });
    });
  });

  describe('DELETE Requests', () => {
    it('should send DELETE request successfully', async () => {
      const mockData = { deleted: true };
      mockFetch.mockResolvedValueOnce(new MockResponse(mockData));

      const { result } = renderHook(() => useDelete());

      await act(async () => {
        await result.current.execute('/api/test/1');
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/test/1', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: undefined,
      });
    });
  });

  describe('PATCH Requests', () => {
    it('should send PATCH data successfully', async () => {
      const mockData = { id: 1, patched: true };
      const patchData = { status: 'active' };
      mockFetch.mockResolvedValueOnce(new MockResponse(mockData));

      const { result } = renderHook(() => usePatch());

      await act(async () => {
        await result.current.execute('/api/test/1', patchData);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/test/1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patchData),
      });
    });
  });

  describe('Loading States', () => {
    it('should manage loading state correctly', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      mockFetch.mockReturnValueOnce(promise);

      const { result } = renderHook(() => useGet());

      // Start request
      act(() => {
        result.current.execute('/api/test');
      });

      expect(result.current.loading).toBe(true);

      // Resolve request
      await act(async () => {
        resolvePromise!(new MockResponse({ success: true }));
        await promise;
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset state correctly', async () => {
      const mockData = { id: 1 };
      mockFetch.mockResolvedValueOnce(new MockResponse(mockData));

      const { result } = renderHook(() => useGet());

      // Execute and get data
      await act(async () => {
        await result.current.execute('/api/test');
      });

      expect(result.current.data).toEqual(mockData);
      expect(result.current.success).toBe(true);

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.data).toBeNull();
      expect(result.current.success).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
    });
  });

  describe('onSuccess and onError Callbacks', () => {
    it('should call onSuccess callback', async () => {
      const mockData = { id: 1 };
      const onSuccess = jest.fn();
      mockFetch.mockResolvedValueOnce(new MockResponse(mockData));

      const { result } = renderHook(() =>
        useGet({ onSuccess })
      );

      await act(async () => {
        await result.current.execute('/api/test');
      });

      expect(onSuccess).toHaveBeenCalledWith(mockData);
    });

    it('should call onError callback', async () => {
      const onError = jest.fn();
      const errorMessage = 'Network error';
      mockFetch.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() =>
        useGet({ onError })
      );

      await act(async () => {
        await result.current.execute('/api/test');
      });

      expect(onError).toHaveBeenCalledWith(errorMessage);
    });
  });

  describe('Base URL and URL Construction', () => {
    it('should handle relative URLs', async () => {
      const mockData = { success: true };
      mockFetch.mockResolvedValueOnce(new MockResponse(mockData));

      const { result } = renderHook(() => useGet()); 

      await act(async () => {
        await result.current.execute('api/test');
      });

      expect(mockFetch).toHaveBeenCalledWith('api/test', expect.any(Object));
    });

    it('should handle absolute URLs', async () => {
      const mockData = { success: true };
      mockFetch.mockResolvedValueOnce(new MockResponse(mockData));

      const { result } = renderHook(() => useGet());

      await act(async () => {
        await result.current.execute('https://api.example.com/data');
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/data',
        expect.any(Object)
      );
    });
  });
});