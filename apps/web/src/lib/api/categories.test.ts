/**
 * Category API Client Tests
 *
 * Tests for CategoryApiClient with mocked fetch.
 * Run with: tsx --test src/lib/api/categories.test.ts
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { CategoryApiClient, ApiClientError, categoriesApi } from './categories';
import type { CategoryData, CategoryCreateInput, CategoryUpdateInput } from './types';

/**
 * Mock category data matching Prisma Category model scalar fields
 */
const mockCategory: CategoryData = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  name: 'Зарплата',
  type: 'income',
  parentId: null,
  order: 0,
  isActive: true,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};

const mockChildCategory: CategoryData = {
  id: '550e8400-e29b-41d4-a716-446655440002',
  name: 'Премия',
  type: 'income',
  parentId: mockCategory.id,
  order: 1,
  isActive: true,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};

const mockExpenseCategory: CategoryData = {
  id: '550e8400-e29b-41d4-a716-446655440003',
  name: 'Аренда',
  type: 'expense',
  parentId: null,
  order: 0,
  isActive: true,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};

/**
 * Mock fetch implementation
 */
function createMockFetch(responseData: unknown, status = 200, ok = true) {
  return async () => {
    return {
      ok,
      status,
      json: async () => responseData,
      headers: {
        get: (name: string) => (name === 'content-type' ? 'application/json' : null),
      },
    } as unknown as Response;
  };
}

describe('CategoryApiClient', () => {
  let client: CategoryApiClient;

  beforeEach(() => {
    client = new CategoryApiClient();
  });

  describe('getCategories', () => {
    it('should return categories list', async () => {
      const mockData = {
        data: [mockCategory, mockExpenseCategory],
        count: 2,
      };

      (client as any).fetchFn = createMockFetch(mockData);

      const result = await client.getCategories();

      assert.strictEqual(result.data.length, 2);
      assert.strictEqual(result.data[0].id, mockCategory.id);
      assert.strictEqual(result.data[0].name, mockCategory.name);
      assert.strictEqual(result.count, 2);
    });

    it('should pass type filter in query params', async () => {
      const mockData = { data: [mockCategory], count: 1 };
      let capturedUrl = '';

      (client as any).fetchFn = async (url: string) => {
        capturedUrl = url.toString();
        return {
          ok: true,
          status: 200,
          json: async () => mockData,
          headers: { get: () => 'application/json' },
        } as unknown as Response;
      };

      await client.getCategories({ type: 'income' });

      assert.ok(capturedUrl.includes('type=income'));
    });

    it('should pass isActive filter in query params', async () => {
      const mockData = { data: [mockCategory], count: 1 };
      let capturedUrl = '';

      (client as any).fetchFn = async (url: string) => {
        capturedUrl = url.toString();
        return {
          ok: true,
          status: 200,
          json: async () => mockData,
          headers: { get: () => 'application/json' },
        } as unknown as Response;
      };

      await client.getCategories({ isActive: true });

      assert.ok(capturedUrl.includes('isActive=true'));
    });

    it('should pass includeInactive filter in query params', async () => {
      const mockData = { data: [mockCategory, mockExpenseCategory], count: 2 };
      let capturedUrl = '';

      (client as any).fetchFn = async (url: string) => {
        capturedUrl = url.toString();
        return {
          ok: true,
          status: 200,
          json: async () => mockData,
          headers: { get: () => 'application/json' },
        } as unknown as Response;
      };

      await client.getCategories({ includeInactive: true });

      assert.ok(capturedUrl.includes('includeInactive=true'));
    });

    it('should handle API error response', async () => {
      const mockError = {
        error: 'Failed to fetch categories',
        message: 'Database connection error',
      };

      (client as any).fetchFn = createMockFetch(mockError, 500, false);

      await assert.rejects(
        async () => client.getCategories(),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          const apiError = err as ApiClientError;
          assert.strictEqual(apiError.statusCode, 500);
          assert.strictEqual(apiError.error, 'Failed to fetch categories');
          return true;
        }
      );
    });

    it('should handle empty response', async () => {
      const mockData = { data: [], count: 0 };
      (client as any).fetchFn = createMockFetch(mockData);

      const result = await client.getCategories();

      assert.deepStrictEqual(result.data, []);
      assert.strictEqual(result.count, 0);
    });
  });

  describe('getCategory', () => {
    it('should return single category by ID', async () => {
      const mockData = { data: mockCategory };
      (client as any).fetchFn = createMockFetch(mockData);

      const result = await client.getCategory(mockCategory.id);

      assert.strictEqual(result.data.id, mockCategory.id);
      assert.strictEqual(result.data.name, mockCategory.name);
      assert.strictEqual(result.data.type, mockCategory.type);
    });

    it('should throw error when ID is empty', async () => {
      await assert.rejects(
        async () => client.getCategory(''),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).error, 'Validation failed');
          assert.strictEqual((err as ApiClientError).message, 'id is required');
          return true;
        }
      );
    });

    it('should handle 404 response', async () => {
      const mockError = {
        error: 'Not found',
        message: `Category with id ${mockCategory.id} not found`,
      };

      (client as any).fetchFn = createMockFetch(mockError, 404, false);

      await assert.rejects(
        async () => client.getCategory(mockCategory.id),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          const apiError = err as ApiClientError;
          assert.strictEqual(apiError.statusCode, 404);
          assert.strictEqual(apiError.error, 'Not found');
          return true;
        }
      );
    });

    it('should build correct URL for category ID', async () => {
      const mockData = { data: mockCategory };
      let capturedUrl = '';

      (client as any).fetchFn = async (url: string) => {
        capturedUrl = url.toString();
        return {
          ok: true,
          status: 200,
          json: async () => mockData,
          headers: { get: () => 'application/json' },
        } as unknown as Response;
      };

      await client.getCategory('test-id-123');

      assert.ok(capturedUrl.includes('/categories/test-id-123'));
    });
  });

  describe('createCategory', () => {
    it('should create new category and return it', async () => {
      const createData: CategoryCreateInput = {
        name: 'Новая категория',
        type: 'income',
        order: 2,
      };

      const mockResponse = { data: { ...mockCategory, ...createData } };
      (client as any).fetchFn = createMockFetch(mockResponse, 201);

      const result = await client.createCategory(createData);

      assert.strictEqual(result.data.name, createData.name);
      assert.strictEqual(result.data.type, createData.type);
    });

    it('should create category with parentId', async () => {
      const createData: CategoryCreateInput = {
        name: 'Подкатегория',
        type: 'income',
        parentId: mockCategory.id,
      };

      const mockResponse = { data: { ...mockChildCategory, ...createData } };
      (client as any).fetchFn = createMockFetch(mockResponse, 201);

      const result = await client.createCategory(createData);

      assert.strictEqual(result.data.name, 'Подкатегория');
      assert.strictEqual(result.data.parentId, mockCategory.id);
    });

    it('should handle validation error (missing name)', async () => {
      const invalidData: CategoryCreateInput = {
        name: '',
        type: 'income',
      };

      const mockError = {
        error: 'Validation failed',
        message: 'name is required',
      };

      (client as any).fetchFn = createMockFetch(mockError, 400, false);

      await assert.rejects(
        async () => client.createCategory(invalidData),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).error, 'Validation failed');
          assert.strictEqual((err as ApiClientError).message, 'name is required');
          return true;
        }
      );
    });

    it('should handle validation error (invalid type)', async () => {
      const invalidData: CategoryCreateInput = {
        name: 'Категория',
        type: 'invalid' as any,
      };

      const mockError = {
        error: 'Validation failed',
        message: 'type must be income or expense',
      };

      (client as any).fetchFn = createMockFetch(mockError, 400, false);

      await assert.rejects(
        async () => client.createCategory(invalidData),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).message, 'type must be income or expense');
          return true;
        }
      );
    });

    it('should handle validation error (invalid parentId)', async () => {
      const invalidData: CategoryCreateInput = {
        name: 'Категория',
        type: 'income',
        parentId: 'non-existent-id',
      };

      const mockError = {
        error: 'Validation failed',
        message: 'parentId does not reference an existing category',
      };

      (client as any).fetchFn = createMockFetch(mockError, 400, false);

      await assert.rejects(
        async () => client.createCategory(invalidData),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).error, 'Validation failed');
          return true;
        }
      );
    });

    it('should send POST request', async () => {
      const createData: CategoryCreateInput = {
        name: 'Тест',
        type: 'expense',
      };

      let capturedOptions: RequestInit | undefined;

      (client as any).fetchFn = async (_url: string, options: RequestInit) => {
        capturedOptions = options;
        return {
          ok: true,
          status: 201,
          json: async () => ({ data: mockExpenseCategory }),
          headers: { get: () => 'application/json' },
        } as unknown as Response;
      };

      await client.createCategory(createData);

      assert.strictEqual(capturedOptions?.method, 'POST');
    });
  });

  describe('updateCategory', () => {
    it('should update category and return updated data', async () => {
      const updateData: CategoryUpdateInput = {
        name: 'Обновленная категория',
        order: 5,
      };

      const mockResponse = {
        data: { ...mockCategory, ...updateData },
      };

      (client as any).fetchFn = createMockFetch(mockResponse);

      const result = await client.updateCategory(mockCategory.id, updateData);

      assert.strictEqual(result.data.name, 'Обновленная категория');
      assert.strictEqual(result.data.order, 5);
    });

    it('should update category type', async () => {
      const updateData: CategoryUpdateInput = {
        type: 'expense',
      };

      const mockResponse = {
        data: { ...mockCategory, type: 'expense' },
      };

      (client as any).fetchFn = createMockFetch(mockResponse);

      const result = await client.updateCategory(mockCategory.id, updateData);

      assert.strictEqual(result.data.type, 'expense');
    });

    it('should throw error when ID is empty', async () => {
      await assert.rejects(
        async () => client.updateCategory('', { name: 'Test' }),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).error, 'Validation failed');
          assert.strictEqual((err as ApiClientError).message, 'id is required');
          return true;
        }
      );
    });

    it('should handle 404 when category not found', async () => {
      const mockError = {
        error: 'Not found',
        message: `Category with id ${mockCategory.id} not found`,
      };

      (client as any).fetchFn = createMockFetch(mockError, 404, false);

      await assert.rejects(
        async () => client.updateCategory(mockCategory.id, { name: 'Test' }),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          const apiError = err as ApiClientError;
          assert.strictEqual(apiError.statusCode, 404);
          assert.strictEqual(apiError.error, 'Not found');
          return true;
        }
      );
    });

    it('should send PATCH request', async () => {
      let capturedOptions: RequestInit | undefined;

      (client as any).fetchFn = async (_url: string, options: RequestInit) => {
        capturedOptions = options;
        return {
          ok: true,
          status: 200,
          json: async () => ({ data: mockCategory }),
          headers: { get: () => 'application/json' },
        } as unknown as Response;
      };

      await client.updateCategory(mockCategory.id, { name: 'Test' });

      assert.strictEqual(capturedOptions?.method, 'PATCH');
    });
  });

  describe('deleteCategory', () => {
    it('should soft-delete category and return message', async () => {
      const mockResponse = {
        data: { ...mockCategory, isActive: false },
        message: 'Category deactivated successfully',
      };

      (client as any).fetchFn = createMockFetch(mockResponse);

      const result = await client.deleteCategory(mockCategory.id);

      assert.strictEqual(result.data.id, mockCategory.id);
      assert.strictEqual(result.message, 'Category deactivated successfully');
    });

    it('should throw error when ID is empty', async () => {
      await assert.rejects(
        async () => client.deleteCategory(''),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).error, 'Validation failed');
          assert.strictEqual((err as ApiClientError).message, 'id is required');
          return true;
        }
      );
    });

    it('should handle 404 when category not found', async () => {
      const mockError = {
        error: 'Not found',
        message: `Category with id ${mockCategory.id} not found`,
      };

      (client as any).fetchFn = createMockFetch(mockError, 404, false);

      await assert.rejects(
        async () => client.deleteCategory(mockCategory.id),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          const apiError = err as ApiClientError;
          assert.strictEqual(apiError.statusCode, 404);
          assert.strictEqual(apiError.error, 'Not found');
          return true;
        }
      );
    });

    it('should handle 409 conflict when category is referenced', async () => {
      const mockError = {
        error: 'Conflict',
        message: 'Cannot delete category: referenced by Budget or Transaction records. Remove references first.',
      };

      (client as any).fetchFn = createMockFetch(mockError, 409, false);

      await assert.rejects(
        async () => client.deleteCategory(mockCategory.id),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          const apiError = err as ApiClientError;
          assert.strictEqual(apiError.statusCode, 409);
          assert.strictEqual(apiError.error, 'Conflict');
          return true;
        }
      );
    });

    it('should send DELETE request', async () => {
      let capturedOptions: RequestInit | undefined;

      (client as any).fetchFn = async (_url: string, options: RequestInit) => {
        capturedOptions = options;
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: { ...mockCategory, isActive: false },
            message: 'Category deactivated successfully',
          }),
          headers: { get: () => 'application/json' },
        } as unknown as Response;
      };

      await client.deleteCategory(mockCategory.id);

      assert.strictEqual(capturedOptions?.method, 'DELETE');
    });
  });

  describe('ApiClientError', () => {
    it('should have correct error properties', () => {
      const error = new ApiClientError(404, 'Not found', 'Resource not found');

      assert.strictEqual(error.statusCode, 404);
      assert.strictEqual(error.error, 'Not found');
      assert.strictEqual(error.message, 'Resource not found');
      assert.strictEqual(error.name, 'ApiClientError');
    });
  });

  describe('singleton instance', () => {
    it('should export default singleton', () => {
      assert.ok(categoriesApi instanceof CategoryApiClient);
    });

    it('should export convenience methods', () => {
      assert.strictEqual(typeof categoriesApi.getCategories, 'function');
      assert.strictEqual(typeof categoriesApi.getCategory, 'function');
      assert.strictEqual(typeof categoriesApi.createCategory, 'function');
      assert.strictEqual(typeof categoriesApi.updateCategory, 'function');
      assert.strictEqual(typeof categoriesApi.deleteCategory, 'function');
    });
  });
});
