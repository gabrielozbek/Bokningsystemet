namespace WebApp;

public static class AvailabilityApi
{
    private const string OpeningTime = "17:00";
    private const string ClosingTime = "22:00";

    public static void Start()
    {
        App.MapGet("/api/availability", (HttpContext context, string? date) =>
        {
            var targetDate = string.IsNullOrWhiteSpace(date)
                ? DateOnly.FromDateTime(DateTime.Today)
                : DateOnly.Parse(date);

            var tables = SQLQuery(
                "SELECT id, name, capacity FROM tables WHERE is_active = 1 ORDER BY name",
                null,
                context
            );

            var bookings = SQLQuery(
                @"SELECT b.*, t.name AS tableName, u.email AS userEmail
                  FROM bookings AS b
                  LEFT JOIN tables AS t ON t.id = b.tableId
                  LEFT JOIN users AS u ON u.id = b.userId
                  WHERE DATE(b.start) = $date
                  ORDER BY b.start",
                new { date = targetDate.ToString("yyyy-MM-dd") },
                context
            );

            var availability = Arr();

            foreach (dynamic table in tables)
            {
                var tableBookings = bookings
                    .Filter(x => x.tableId == table.id)
                    .Sort((a, b) => DateTime.Parse((string)a.start).CompareTo(DateTime.Parse((string)b.start)));

                var slots = Arr();

                var dayStart = DateTime.Parse($"{targetDate:yyyy-MM-dd}T{OpeningTime}:00");
                var dayEnd = DateTime.Parse($"{targetDate:yyyy-MM-dd}T{ClosingTime}:00");
                var cursor = dayStart;

                foreach (dynamic booking in tableBookings)
                {
                    var bookingStart = DateTime.Parse((string)booking.start);
                    var bookingEnd = DateTime.Parse((string)booking.endTime);

                    if (bookingStart > cursor)
                    {
                        slots.Push(Obj(new
                        {
                            type = "available",
                            start = cursor.ToString("yyyy-MM-ddTHH:mm:ss"),
                            end = bookingStart.ToString("yyyy-MM-ddTHH:mm:ss")
                        }));
                    }

                    slots.Push(Obj(new
                    {
                        type = "booked",
                        booking.id,
                        booking.userId,
                        booking.userEmail,
                        booking.status,
                        start = bookingStart.ToString("yyyy-MM-ddTHH:mm:ss"),
                        end = bookingEnd.ToString("yyyy-MM-ddTHH:mm:ss")
                    }));

                    if (bookingEnd > cursor)
                    {
                        cursor = bookingEnd;
                    }
                }

                if (cursor < dayEnd)
                {
                    slots.Push(Obj(new
                    {
                        type = "available",
                        start = cursor.ToString("yyyy-MM-ddTHH:mm:ss"),
                        end = dayEnd.ToString("yyyy-MM-ddTHH:mm:ss")
                    }));
                }

                availability.Push(Obj(new
                {
                    tableId = table.id,
                    tableName = table.name,
                    capacity = table.capacity,
                    date = targetDate.ToString("yyyy-MM-dd"),
                    slots
                }));
            }

            return RestResult.Parse(context, availability);
        });
    }
}
