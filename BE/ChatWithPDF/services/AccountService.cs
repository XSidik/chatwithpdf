using ChatWithPDF.Data;
using ChatWithPDF.Models;
using Microsoft.EntityFrameworkCore;

namespace ChatWithPDF.Services;

public interface IAccountService
{
    Task<User> RegisterAsync(string email, string name);
    Task<User> GetByEmailAsync(string email);
    Task UpdateRefreshTokenAsync(Guid userId, string token, DateTime expiry);
    Task<User?> GetByRefreshTokenAsync(string token);
}

public class AccountService : IAccountService
{
    private readonly ApplicationDbContext _context;

    public AccountService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<User> RegisterAsync(string email, string name)
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            Name = name,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return user;
    }

    public async Task<User> GetByEmailAsync(string email)
    {
        return await _context.Users.FirstOrDefaultAsync(u => u.Email == email) ?? null!;
    }

    public async Task UpdateRefreshTokenAsync(Guid userId, string token, DateTime expiry)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user != null)
        {
            user.RefreshToken = token;
            user.RefreshTokenExpiry = expiry;
            await _context.SaveChangesAsync();
        }
    }

    public async Task<User?> GetByRefreshTokenAsync(string token)
    {
        return await _context.Users.FirstOrDefaultAsync(u => u.RefreshToken == token);
    }
}