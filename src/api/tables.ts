import type Table from '../interfaces/Table';
import request from './client';

const BASE_URL = '/api/tables';

export async function fetchTables(): Promise<Table[]> {
  return request<Table[]>(BASE_URL);
}

export interface TablePayload {
  name: string;
  capacity: number;
  location: string;
  description: string;
  is_active: boolean;
}

function serialize(payload: TablePayload | Partial<TablePayload>) {
  const result: Record<string, unknown> = { ...payload };
  if (result.is_active !== undefined) {
    result.is_active = payload.is_active ? 1 : 0;
  }
  return result;
}

export async function createTable(payload: TablePayload): Promise<Table> {
  return request<Table>(BASE_URL, {
    method: 'POST',
    body: JSON.stringify(serialize(payload))
  });
}

export async function updateTable(id: number, payload: Partial<TablePayload>): Promise<Table> {
  return request<Table>(`${BASE_URL}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(serialize(payload))
  });
}

export async function deleteTable(id: number): Promise<void> {
  await request<void>(`${BASE_URL}/${id}`, {
    method: 'DELETE',
    parseJson: false
  });
}
