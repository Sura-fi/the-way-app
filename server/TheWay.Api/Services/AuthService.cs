using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text.RegularExpressions;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using TheWay.Api.Configuration;
using TheWay.Api.Data;
using TheWay.Api.Models.Domain;
using TheWay.Api.Models.Dtos.Auth;

namespace TheWay.Api.Services;

public class AuthService
{
    private static readonly Regex PhoneRegex = new(@"^(\+251|0)[79]\d{8}$");

    private readonly AppDbContext _db;
    private readonly JwtSettings _jwtSettings;

    public AuthService(AppDbContext db, IOptions<JwtSettings> jwtSettings)
    {
        _db = db;
        _jwtSettings = jwtSettings.Value;
    }

    // ──────────────────────────────────────────
    // REGISTER — Creates a new God Child account
    // ──────────────────────────────────────────
    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        // 1. Check if email is already taken
        var existingUser = await _db.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

        if (existingUser != null)
            throw new InvalidOperationException("A user with this email already exists.");

        // 2. Validate phone if provided
        var phone = request.PhoneNumber.Trim();
        if (!string.IsNullOrEmpty(phone) && !PhoneRegex.IsMatch(phone))
            throw new InvalidOperationException("Invalid phone number format.");

        // 3. Create the new user
        var user = new User
        {
            Id = Guid.NewGuid(),
            FormalName = request.FormalName.Trim(),
            SpiritualName = request.SpiritualName.Trim(),
            Email = request.Email.ToLower().Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            PhoneNumber = phone,
            Role = "GodChild",   // FORCED — cannot register as Priest
            MustChangePassword = false,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        // 4. Save to database
        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        // 5. Generate JWT and return response
        var token = GenerateJwtToken(user);

        return new AuthResponse
        {
            Token = token,
            Role = user.Role,
            MustChangePassword = user.MustChangePassword,
            FormalName = user.FormalName,
            SpiritualName = user.SpiritualName,
            PhoneNumber = user.PhoneNumber,
            Email = user.Email,
            ProfilePictureUrl = user.ProfilePictureUrl 

        };
    }

    // ──────────────────────────────────────────
    // LOGIN — Validates credentials and returns JWT
    // ──────────────────────────────────────────
    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        // 1. Find user by email
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

        if (user == null)
            throw new UnauthorizedAccessException("Invalid email or password.");

        // 2. Check if account is active
        if (!user.IsActive)
            throw new UnauthorizedAccessException("This account has been deactivated.");

        // 3. Verify password against the stored BCrypt hash
        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid email or password.");

        // 4. Generate JWT and return response
        var token = GenerateJwtToken(user);

        return new AuthResponse
        {
            Token = token,
            Role = user.Role,
            MustChangePassword = user.MustChangePassword,
            FormalName = user.FormalName,
            SpiritualName = user.SpiritualName,
            PhoneNumber = user.PhoneNumber,
            Email = user.Email,
            ProfilePictureUrl = user.ProfilePictureUrl
        };
    }

    // ──────────────────────────────────────────
    // UPDATE PROFILE
    // ──────────────────────────────────────────
    public async Task UpdateProfileAsync(Guid userId, UpdateProfileRequest request)
    {
        var user = await _db.Users.FindAsync(userId);

        if (user == null)
            throw new InvalidOperationException("User not found.");

        if (request.PhoneNumber != null)
        {
            var phone = request.PhoneNumber.Trim();
            if (!string.IsNullOrEmpty(phone) && !PhoneRegex.IsMatch(phone))
                throw new InvalidOperationException("Invalid phone number format.");

            user.PhoneNumber = phone;
        }

         if (request.FormalName != null)
    {
        var name = request.FormalName.Trim();
        if (string.IsNullOrEmpty(name))
            throw new InvalidOperationException("Name cannot be empty.");
        user.FormalName = name;
    }

    if (request.ProfilePicture != null)
    {
        var pic = request.ProfilePicture.Trim();
        if (pic.Length == 0)
        {
            user.ProfilePictureUrl = null; // clear
        }
        else
        {
            if (!pic.StartsWith("data:image/"))
                throw new InvalidOperationException("Invalid image format.");
            if (pic.Length > 700_000)                            // ~0.5 MB
                throw new InvalidOperationException("Image is too large.");
            user.ProfilePictureUrl = pic;
        }
    }

        await _db.SaveChangesAsync();
    }

    // ──────────────────────────────────────────
    // CHANGE PASSWORD
    // ──────────────────────────────────────────
    public async Task ChangePasswordAsync(Guid userId, ChangePasswordRequest request)
    {
        // 1. Find the user
        var user = await _db.Users.FindAsync(userId);

        if (user == null)
            throw new InvalidOperationException("User not found.");

        // 2. Verify the current password
        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            throw new UnauthorizedAccessException("Current password is incorrect.");

        // 3. Hash and save the new password
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.MustChangePassword = false;  // Clear the forced change flag

        await _db.SaveChangesAsync();
    }

    // ──────────────────────────────────────────
    // PRIVATE: JWT Token Generation
    // ──────────────────────────────────────────
    private string GenerateJwtToken(User user)
    {
        // Claims are pieces of information embedded inside the JWT
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("formalName", user.FormalName),
            new Claim("spiritualName", user.SpiritualName)
        };

        // Create the signing key from our secret
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_jwtSettings.Secret));

        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        // Build the token
        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpirationMinutes),
            signingCredentials: credentials
        );

        // Serialize the token to a string
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
