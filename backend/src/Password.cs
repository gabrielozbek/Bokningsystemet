namespace WebApp;
static class Password
{
    private static int Cost = 13;

    public static string Encrypt(string password)
    {
        return BCryptNet.HashPassword(password, workFactor: Cost);
    }

    public static bool Verify(string password, string encrypted)
    {
        return BCryptNet.Verify(password, encrypted);
    }
}
