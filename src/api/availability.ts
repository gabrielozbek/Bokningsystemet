import request from './client';

type AvailabilitySlotType = 'available' | 'booked';

export interface AvailabilitySlot {
  type: AvailabilitySlotType;
  start: string;
  end: string;
  bookingId?: number;
  userEmail?: string;
  status?: string;
}

export interface AvailabilityTable {
  tableId: number;
  tableName: string;
  capacity: number;
  date: string;
  slots: AvailabilitySlot[];
}

export async function fetchAvailability(date: string): Promise<AvailabilityTable[]> {
  const url = `/api/availability?date=${encodeURIComponent(date)}`;
  return request<AvailabilityTable[]>(url);
}
