import { useCallback, useEffect, useMemo, useState } from 'react';
import type Table from '../interfaces/Table';
import {
  fetchTables,
  createTable as apiCreateTable,
  updateTable as apiUpdateTable,
  deleteTable as apiDeleteTable,
  type TablePayload
} from '../api/tables';
import type { ApiError } from '../api/client';

interface UseTablesAdminResult {
  tables: Table[];
  isLoading: boolean;
  error: ApiError | null;
  reload: () => Promise<void>;
  create: (payload: TablePayload) => Promise<Table>;
  update: (id: number, payload: Partial<TablePayload>) => Promise<Table>;
  remove: (id: number) => Promise<void>;
}

export default function useTablesAdmin(autoLoad = true): UseTablesAdminResult {
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const handleError = useCallback((err: unknown) => {
    const apiError: ApiError = err instanceof Error
      ? Object.assign(err, { status: (err as ApiError).status ?? 0 }) as ApiError
      : Object.assign(new Error('Okänt fel'), { status: 0 });
    setError(apiError);
  }, []);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchTables();
      setTables(data);
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  useEffect(() => {
    if (autoLoad) {
      load().catch(handleError);
    }
  }, [autoLoad, load, handleError]);

  const create = useCallback(async (payload: TablePayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const created = await apiCreateTable(payload);
      setTables(previous => [...previous, created]);
      return created;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  const update = useCallback(async (id: number, payload: Partial<TablePayload>) => {
    setIsLoading(true);
    setError(null);
    try {
      const updated = await apiUpdateTable(id, payload);
      setTables(previous => previous.map(table => table.id === id ? updated : table));
      return updated;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  const remove = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      await apiDeleteTable(id);
      setTables(previous => previous.filter(table => table.id !== id));
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  return useMemo(() => ({ tables, isLoading, error, reload: load, create, update, remove }), [tables, isLoading, error, load, create, update, remove]);
}
