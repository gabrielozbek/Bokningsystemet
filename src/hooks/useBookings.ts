import { useCallback, useEffect, useMemo, useState } from 'react';
import type Booking from '../interfaces/Booking';
import type { ApiError } from '../api/client';
import {
  fetchBookings,
  createBooking as apiCreateBooking,
  updateBooking as apiUpdateBooking,
  deleteBooking as apiDeleteBooking,
  type BookingPayload
} from '../api/bookings';

interface UseBookingsOptions {
  autoLoad?: boolean;
}

interface UseBookingsResult {
  bookings: Booking[];
  isLoading: boolean;
  error: ApiError | null;
  reload: () => Promise<void>;
  create: (payload: BookingPayload) => Promise<Booking>;
  update: (id: number, payload: Partial<BookingPayload>) => Promise<Booking>;
  remove: (id: number) => Promise<void>;
}

export default function useBookings(options: UseBookingsOptions = {}): UseBookingsResult {
  const { autoLoad = true } = options;
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const handleError = useCallback((err: unknown) => {
    const apiError: ApiError = err instanceof Error
      ? err as ApiError
      : Object.assign(new Error('Okant fel'), { status: 0 });
    setError(apiError);
  }, []);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchBookings();
      setBookings(data);
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

  const create = useCallback(async (payload: BookingPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const created = await apiCreateBooking(payload);
      setBookings(previous => [...previous, created]);
      return created;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  const update = useCallback(async (id: number, payload: Partial<BookingPayload>) => {
    setIsLoading(true);
    setError(null);
    try {
      const updated = await apiUpdateBooking(id, payload);
      setBookings(previous => previous.map(item => item.id === id ? updated : item));
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
      await apiDeleteBooking(id);
      setBookings(previous => previous.filter(item => item.id !== id));
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  return useMemo(() => ({
    bookings,
    isLoading,
    error,
    reload: load,
    create,
    update,
    remove
  }), [bookings, isLoading, error, load, create, update, remove]);
}



