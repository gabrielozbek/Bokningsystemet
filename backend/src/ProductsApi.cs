namespace WebApp;

public static class ProductsApi
{
    public static void Start()
    {
        App.MapGet("/api/products", (HttpContext context) =>
        {
            var products = SQLQuery("SELECT * FROM products ORDER BY name", null, context);
            return RestResult.Parse(context, products);
        });

        App.MapGet("/api/products/{id:int}", (HttpContext context, int id) =>
        {
            var product = SQLQueryOne(
                "SELECT * FROM products WHERE id = $id",
                new { id },
                context
            );
            return RestResult.Parse(context, product);
        });

        App.MapPost("/api/products", (HttpContext context, JsonElement bodyJson) =>
        {
            var body = JSON.Parse(bodyJson.ToString());
            body.Delete("id");
            NormalizeCategories(body);
            var parsed = ReqBodyParse("products", body);
            var sql = $"INSERT INTO products({parsed.insertColumns}) VALUES({parsed.insertValues})";
            var result = SQLQueryOne(sql, parsed.body, context);

            if (!result.HasKey("error"))
            {
                result = SQLQueryOne("SELECT * FROM products WHERE id = last_insert_rowid()", null, context);
            }

            return RestResult.Parse(context, result);
        });

        App.MapPut("/api/products/{id:int}", (HttpContext context, int id, JsonElement bodyJson) =>
        {
            var body = JSON.Parse(bodyJson.ToString());
            body.id = id;
            NormalizeCategories(body);
            var parsed = ReqBodyParse("products", body);
            var sql = $"UPDATE products SET {parsed.update} WHERE id = $id";
            var result = SQLQueryOne(sql, parsed.body, context);

            if (!result.HasKey("error") && result.HasKey("rowsAffected") && result.rowsAffected == 1)
            {
                result = SQLQueryOne("SELECT * FROM products WHERE id = $id", new { id }, context);
            }

            return RestResult.Parse(context, result);
        });

        App.MapDelete("/api/products/{id:int}", (HttpContext context, int id) =>
        {
            var result = SQLQueryOne(
                "DELETE FROM products WHERE id = $id",
                new { id },
                context
            );
            return RestResult.Parse(context, result);
        });
    }

    private static void NormalizeCategories(dynamic body)
    {
        if (!body.HasKey("categories"))
        {
            return;
        }

        var categories = (object)body.categories;
        if (categories == null)
        {
            body.categories = "JSON:[]";
            return;
        }

        if (categories is string strCategories)
        {
            body.categories = strCategories.StartsWith("JSON:", System.StringComparison.Ordinal)
                ? strCategories
                : "JSON:" + strCategories;
            return;
        }

        body.categories = "JSON:" + JSON.Stringify(body.categories);
    }
}
