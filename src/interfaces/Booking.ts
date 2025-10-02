export default interface Booking {
  id: number;
  userId: number;
  tableId: number;
  guestCount: number;
  start: string;
  endTime: string;
  status: string;
  note: string;
  userEmail?: string;
  tableName?: string;
}
