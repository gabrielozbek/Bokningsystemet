namespace WebApp;

public static class BookingsApi
{
    public static void Start()
    {
        App.MapGet("/api/bookings", (HttpContext context) =>
        {
            var bookings = SQLQuery(
                @"SELECT b.*, t.name AS tableName, u.email AS userEmail
                   FROM bookings AS b
                   LEFT JOIN tables AS t ON t.id = b.tableId
                   LEFT JOIN users AS u ON u.id = b.userId
                   ORDER BY b.start",
                null,
                context
            );
            return RestResult.Parse(context, bookings);
        });

        App.MapGet("/api/bookings/{id:int}", (HttpContext context, int id) =>
        {
            var booking = SQLQueryOne(
                @"SELECT b.*, t.name AS tableName, u.email AS userEmail
                   FROM bookings AS b
                   LEFT JOIN tables AS t ON t.id = b.tableId
                   LEFT JOIN users AS u ON u.id = b.userId
                   WHERE b.id = $id",
                new { id },
                context
            );
            return RestResult.Parse(context, booking);
        });

        App.MapPost("/api/bookings", (HttpContext context, JsonElement bodyJson) =>
        {
            var body = JSON.Parse(bodyJson.ToString());
            body.Delete("id");
            if (!body.HasKey("status") || string.IsNullOrWhiteSpace(((object)body.status)?.ToString()))
            {
                body.status = "booked";
            }

            var parsed = ReqBodyParse("bookings", body);
            var sql = $"INSERT INTO bookings({parsed.insertColumns}) VALUES({parsed.insertValues})";
            var result = SQLQueryOne(sql, parsed.body, context);

            if (!result.HasKey("error"))
            {
                result = SQLQueryOne(
                    @"SELECT b.*, t.name AS tableName, u.email AS userEmail
                       FROM bookings AS b
                       LEFT JOIN tables AS t ON t.id = b.tableId
                       LEFT JOIN users AS u ON u.id = b.userId
                       WHERE b.id = last_insert_rowid()",
                    null,
                    context
                );
            }

            return RestResult.Parse(context, result);
        });

        App.MapPut("/api/bookings/{id:int}", (HttpContext context, int id, JsonElement bodyJson) =>
        {
            var body = JSON.Parse(bodyJson.ToString());
            body.id = id;
            if (body.HasKey("status") && string.IsNullOrWhiteSpace(((object)body.status)?.ToString()))
            {
                body.status = "booked";
            }

            var parsed = ReqBodyParse("bookings", body);
            var sql = $"UPDATE bookings SET {parsed.update} WHERE id = $id";
            var result = SQLQueryOne(sql, parsed.body, context);

            if (!result.HasKey("error") && result.HasKey("rowsAffected") && result.rowsAffected == 1)
            {
                result = SQLQueryOne(
                    @"SELECT b.*, t.name AS tableName, u.email AS userEmail
                       FROM bookings AS b
                       LEFT JOIN tables AS t ON t.id = b.tableId
                       LEFT JOIN users AS u ON u.id = b.userId
                       WHERE b.id = $id",
                    new { id },
                    context
                );
            }

            return RestResult.Parse(context, result);
        });

        App.MapDelete("/api/bookings/{id:int}", (HttpContext context, int id) =>
        {
            var result = SQLQueryOne(
                "DELETE FROM bookings WHERE id = $id",
                new { id },
                context
            );
            return RestResult.Parse(context, result);
        });
    }
}
