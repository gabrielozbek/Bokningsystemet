namespace WebApp;

public static class DatabaseSetup
{
    public static void Ensure()
    {
        CreateTables();
        SeedUsers();
        SeedTables();
        SeedProducts();
        SeedBookings();
        SeedAcl();
    }

    private static void CreateTables()
    {
        var commands = new[]
        {
            @"CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                phone TEXT NOT NULL DEFAULT '',
                role TEXT NOT NULL DEFAULT 'user',
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now'))
            )",
            @"CREATE TABLE IF NOT EXISTS tables (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                capacity INTEGER NOT NULL,
                location TEXT NOT NULL DEFAULT '',
                description TEXT NOT NULL DEFAULT '',
                is_active INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now'))
            )",
            @"CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT NOT NULL,
                quantity TEXT NOT NULL,
                price$ NUMERIC NOT NULL,
                slug TEXT NOT NULL UNIQUE,
                categories TEXT NOT NULL
            )",
            @"CREATE TABLE IF NOT EXISTS bookings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId INTEGER NOT NULL,
                tableId INTEGER NOT NULL,
                guestCount INTEGER NOT NULL,
                start TEXT NOT NULL,
                endTime TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'booked',
                note TEXT NOT NULL DEFAULT '',
                FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (tableId) REFERENCES tables(id) ON DELETE CASCADE
            )",
            @"CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                created TEXT NOT NULL DEFAULT (datetime('now')),
                modified TEXT NOT NULL DEFAULT (datetime('now')),
                data TEXT DEFAULT '{}'
            )",
            @"CREATE TABLE IF NOT EXISTS acl (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userRoles TEXT NOT NULL,
                method TEXT NOT NULL DEFAULT 'GET',
                allow TEXT NOT NULL DEFAULT 'allow',
                route TEXT NOT NULL,
                match TEXT NOT NULL DEFAULT 'true',
                comment TEXT NOT NULL DEFAULT ''
            )"
        };

        foreach (var sql in commands)
        {
            SQLQuery(sql);
        }
    }

    private static int CountRows(string table)
    {
        var row = SQLQueryOne($"SELECT COUNT(*) AS count FROM {table}");
        return Convert.ToInt32(row.count ?? 0);
    }

    private static int GetId(string sql, object parameters)
    {
        var row = SQLQueryOne(sql, parameters);
        return Convert.ToInt32(row.id ?? 0);
    }

    private static void SeedUsers()
    {
        if (CountRows("users") > 0)
        {
            return;
        }

        InsertUser("admin@bistro.se", "Admin123!", "Anna", "Andersson", "+4610110000", "admin");
        InsertUser("service@bistro.se", "Staff123!", "Oskar", "Olsson", "+4610110001", "staff");
        InsertUser("kund@example.com", "Kund123!", "Karin", "Kund", "+46701111111", "user");
    }

    private static void InsertUser(string email, string plainPassword, string firstName, string lastName, string phone, string role)
    {
        SQLQuery(@"INSERT INTO users (email, password, first_name, last_name, phone, role)
                  VALUES ($email, $password, $firstName, $lastName, $phone, $role)",
            new
            {
                email,
                password = Password.Encrypt(plainPassword),
                firstName,
                lastName,
                phone,
                role
            }
        );
    }

    private static void SeedTables()
    {
        if (CountRows("tables") > 0)
        {
            return;
        }

        var insertSql = @"INSERT INTO tables (name, capacity, location, description, is_active)
                          VALUES ($name, $capacity, $location, $description, $isActive)";

        var seedData = new[]
        {
            new { name = "Fonsterbord 1", capacity = 2, location = "Fonster", description = "Mysigt bord vid fonstret", isActive = 1 },
            new { name = "Fonsterbord 2", capacity = 4, location = "Fonster", description = "Perfekt for ett mindre sallskap", isActive = 1 },
            new { name = "Barbord", capacity = 2, location = "Bar", description = "Snabbt stopp nara baren", isActive = 1 },
            new { name = "Salong 1", capacity = 6, location = "Salong", description = "Rymligt bord for storre sallskap", isActive = 1 },
            new { name = "Salong 2", capacity = 8, location = "Salong", description = "Avskilt bord for evenemang", isActive = 1 }
        };

        foreach (var table in seedData)
        {
            SQLQuery(insertSql, table);
        }
    }

    private static void SeedProducts()
    {
        if (CountRows("products") > 0)
        {
            return;
        }

        var insertSql = @"INSERT INTO products (name, description, quantity, price$, slug, categories)
                          VALUES ($name, $description, $quantity, $price, $slug, $categories)";

        var products = new[]
        {
            new
            {
                name = "Bistro Burger",
                description = "Saftig burgare med cheddar, karamelliserad lÃ¶k och tryffelmajonnÃ¤s.",
                quantity = "10",
                price = 169m,
                slug = "bistro-burger",
                categories = "JSON:[\"Middag\",\"KÃ¶tt\"]"
            },
            new
            {
                name = "Grillad Lax",
                description = "Grillad laxfilÃ© serverad med citronhollandaise och sparris.",
                quantity = "8",
                price = 189m,
                slug = "grillad-lax",
                categories = "JSON:[\"Middag\",\"Fisk\"]"
            },
            new
            {
                name = "Caprese Sallad",
                description = "Tomater, buffelmozzarella och basilika med balsamicoglace.",
                quantity = "12",
                price = 129m,
                slug = "caprese-sallad",
                categories = "JSON:[\"FÃ¶rrÃ¤tt\",\"Vegetariskt\"]"
            }
        };

        foreach (var product in products)
        {
            SQLQuery(insertSql, product);
        }
    }

    private static void SeedBookings()
    {
        if (CountRows("bookings") > 0)
        {
            return;
        }

        var adminId = GetId("SELECT id FROM users WHERE email = $email", new { email = "admin@bistro.se" });
        var staffId = GetId("SELECT id FROM users WHERE email = $email", new { email = "service@bistro.se" });
        var userId = GetId("SELECT id FROM users WHERE email = $email", new { email = "kund@example.com" });
        var tableOneId = GetId("SELECT id FROM tables WHERE name = $name", new { name = "Fonsterbord 1" });
        var tableTwoId = GetId("SELECT id FROM tables WHERE name = $name", new { name = "Fonsterbord 2" });
        var tableFiveId = GetId("SELECT id FROM tables WHERE name = $name", new { name = "Salong 2" });

        var insertSql = @"INSERT INTO bookings (
                userId, tableId, guestCount, start, endTime, status, note
            ) VALUES (
                $userId, $tableId, $guestCount, $start, $endTime, $status, $note
            )";

        SQLQuery(insertSql, new
        {
            userId = adminId,
            tableId = tableOneId,
            guestCount = 2,
            start = "2025-10-10T18:00:00",
            endTime = "2025-10-10T20:00:00",
            status = "booked",
            note = "Anniversary dinner"
        });

        SQLQuery(insertSql, new
        {
            userId = staffId,
            tableId = tableFiveId,
            guestCount = 6,
            start = "2025-10-11T19:00:00",
            endTime = "2025-10-11T21:30:00",
            status = "blocked",
            note = "Team planning"
        });

        SQLQuery(insertSql, new
        {
            userId = userId,
            tableId = tableTwoId,
            guestCount = 4,
            start = "2025-10-12T17:30:00",
            endTime = "2025-10-12T19:30:00",
            status = "booked",
            note = "Family night"
        });
    }

    private static void SeedAcl()
    {
        if (CountRows("acl") > 0)
        {
            return;
        }

        var insertSql = @"INSERT INTO acl (userRoles, method, allow, route, match, comment)
                          VALUES ($roles, $method, $allow, $route, $match, $comment)";

        var entries = new[]
        {
            new { roles = "visitor,user,staff,admin", method = "GET", allow = "allow", route = "/api", match = "false", comment = "Tillat allt som inte ar API under \"/api\"" },
            new { roles = "visitor,user,staff,admin", method = "*", allow = "allow", route = "/api/login", match = "true", comment = "Inloggningsrutter" },
            new { roles = "visitor", method = "POST", allow = "allow", route = "/api/users", match = "true", comment = "Tillat registrering for besokare" },
            new { roles = "admin", method = "*", allow = "allow", route = "/api/users", match = "true", comment = "Admin hanterar anvandare" },
            new { roles = "admin", method = "*", allow = "allow", route = "/api/acl", match = "true", comment = "Admin hanterar ACL" },
            new { roles = "admin", method = "*", allow = "allow", route = "/api/sessions", match = "true", comment = "Admin ser sessioner" },
            new { roles = "visitor,user,staff,admin", method = "GET", allow = "allow", route = "/api/tables", match = "true", comment = "Lista bord" },
            new { roles = "visitor,user,staff,admin", method = "GET", allow = "allow", route = "/api/products", match = "true", comment = "Lista produkter" },
            new { roles = "visitor,user,staff,admin", method = "GET", allow = "allow", route = "/api/bookings", match = "true", comment = "Lista bokningar" },
            new { roles = "visitor", method = "POST", allow = "allow", route = "/api/bookings", match = "true", comment = "Besokare kan skapa bokning" },
            new { roles = "visitor,user,staff,admin", method = "*", allow = "allow", route = "/api/bookings", match = "true", comment = "Hantera bokningar" }
        };

        foreach (var entry in entries)
        {
            SQLQuery(insertSql, entry);
        }
    }
}
