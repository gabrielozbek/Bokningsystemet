namespace WebApp;

public static class BookingsApi
{
    private static dynamic? GetCurrentUser(HttpContext context)
    {
        try { return Session.Get(context, "user"); }
        catch { return null; }
    }

    private static bool IsCustomer(dynamic? user) => user != null && (string)user.role == "user";

    public static void Start()
    {
        App.MapGet("/api/bookings", (HttpContext context) =>
        {
            var user = GetCurrentUser(context);
            var isCustomer = IsCustomer(user);
            var sql = @"SELECT b.*, t.name AS tableName, u.email AS userEmail
                       FROM bookings AS b
                       LEFT JOIN tables AS t ON t.id = b.tableId
                       LEFT JOIN users AS u ON u.id = b.userId";
            if (isCustomer)
            {
                sql += " WHERE b.userId = $userId";
            }
            sql += " ORDER BY b.start";

            var parameters = isCustomer ? new { userId = (int)user.id } : null;
            var bookings = SQLQuery(sql, parameters, context);
            return RestResult.Parse(context, bookings);
        });

        App.MapGet("/api/bookings/{id:int}", (HttpContext context, int id) =>
        {
            var user = GetCurrentUser(context);
            var isCustomer = IsCustomer(user);
            var sql = @"SELECT b.*, t.name AS tableName, u.email AS userEmail
                       FROM bookings AS b
                       LEFT JOIN tables AS t ON t.id = b.tableId
                       LEFT JOIN users AS u ON u.id = b.userId
                       WHERE b.id = $id";
            if (isCustomer)
            {
                sql += " AND b.userId = $userId";
            }
            var booking = SQLQueryOne(sql, isCustomer ? new { id, userId = (int)user.id } : new { id }, context);
            return RestResult.Parse(context, booking);
        });

        App.MapPost("/api/bookings", (HttpContext context, JsonElement bodyJson) =>
        {
            var user = GetCurrentUser(context);
            var isCustomer = IsCustomer(user);
            var body = JSON.Parse(bodyJson.ToString());
            body.Delete("id");
            if (isCustomer)
            {
                body.userId = (int)user.id;
            }
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
            var user = GetCurrentUser(context);
            var isCustomer = IsCustomer(user);
            if (isCustomer)
            {
                var ownsBooking = SQLQueryOne(
                    "SELECT userId FROM bookings WHERE id = $id",
                    new { id },
                    context
                );
                if (ownsBooking == null || ownsBooking.userId != (int)user.id)
                {
                    return RestResult.Parse(context, new { error = "Not allowed." });
                }
            }

            var body = JSON.Parse(bodyJson.ToString());
            body.id = id;
            if (isCustomer)
            {
                body.userId = (int)user.id;
            }
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
            var user = GetCurrentUser(context);
            var isCustomer = IsCustomer(user);
            if (isCustomer)
            {
                var ownsBooking = SQLQueryOne(
                    "SELECT userId FROM bookings WHERE id = $id",
                    new { id },
                    context
                );
                if (ownsBooking == null || ownsBooking.userId != (int)user.id)
                {
                    return RestResult.Parse(context, new { error = "Not allowed." });
                }
            }

            var result = SQLQueryOne(
                "DELETE FROM bookings WHERE id = $id",
                new { id },
                context
            );
            return RestResult.Parse(context, result);
        });
    }
}
