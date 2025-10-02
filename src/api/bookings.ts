import type Booking from '../interfaces/Booking';
import request from './client';

const BASE_URL = '/api/bookings';

export async function fetchBookings(): Promise<Booking[]> {
  const data = await request<Booking[]>(BASE_URL);
  return data;
}

export async function fetchBooking(id: number): Promise<Booking> {
  return request<Booking>(`${BASE_URL}/${id}`);
}

export interface BookingPayload {
  userId: number;
  tableId: number;
  guestCount: number;
  start: string;
  endTime: string;
  status?: string;
  note?: string;
}

export async function createBooking(payload: BookingPayload): Promise<Booking> {
  return request<Booking>(BASE_URL, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function updateBooking(id: number, payload: Partial<BookingPayload>): Promise<Booking> {
  return request<Booking>(`${BASE_URL}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export async function deleteBooking(id: number): Promise<void> {
  await request<void>(`${BASE_URL}/${id}`, {
    method: 'DELETE',
    parseJson: false
  });
}
