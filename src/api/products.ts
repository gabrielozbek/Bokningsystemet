import type Product from '../interfaces/Product';
import request from './client';

const BASE_URL = '/api/products';

function parseProduct(raw: Product | (Product & { categories: string })): Product {
  const categories = typeof raw.categories === 'string'
    ? parseCategories(raw.categories)
    : raw.categories;

  return {
    ...raw,
    categories
  };
}

function parseCategories(value: string): string[] {
  if (!value) {
    return [];
  }
  if (value.startsWith('JSON:')) {
    try {
      return JSON.parse(value.slice(5));
    } catch {
      return [];
    }
  }
  try {
    return JSON.parse(value);
  } catch {
    return value.split(',').map(x => x.trim()).filter(Boolean);
  }
}

export async function fetchProducts(): Promise<Product[]> {
  const data = await request<Array<Product & { categories: string }>>(BASE_URL);
  return data.map(parseProduct);
}

export async function fetchProduct(id: number): Promise<Product> {
  const data = await request<Product & { categories: string }>(`${BASE_URL}/${id}`);
  return parseProduct(data);
}

export interface ProductPayload {
  name: string;
  description: string;
  quantity: string;
  price$: number;
  slug: string;
  categories: string[];
}

function serializeProduct(payload: ProductPayload | Partial<ProductPayload>) {
  return {
    ...payload,
    categories: payload.categories ? `JSON:${JSON.stringify(payload.categories)}` : undefined
  };
}

export async function createProduct(payload: ProductPayload): Promise<Product> {
  const data = await request<Product & { categories: string }>(BASE_URL, {
    method: 'POST',
    body: JSON.stringify(serializeProduct(payload))
  });
  return parseProduct(data);
}

export async function updateProduct(id: number, payload: Partial<ProductPayload>): Promise<Product> {
  const data = await request<Product & { categories: string }>(`${BASE_URL}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(serializeProduct(payload))
  });
  return parseProduct(data);
}

export async function deleteProduct(id: number): Promise<void> {
  await request<void>(`${BASE_URL}/${id}`, {
    method: 'DELETE',
    parseJson: false
  });
}
