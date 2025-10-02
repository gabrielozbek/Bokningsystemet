import type Table from '../interfaces/Table';
import request from './client';

const BASE_URL = '/api/tables';

export async function fetchTables(): Promise<Table[]> {
  return request<Table[]>(BASE_URL);
}
