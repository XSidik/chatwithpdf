using Microsoft.AspNetCore.Mvc;
using ChatWithPDF.Services;
using ChatWithPDF.dtos;
using Google.Apis.Auth;
using Microsoft.AspNetCore.Authorization;


namespace ChatWithPDF.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AccountController : ControllerBase
{
    private readonly IAccountService _accountService;
    private readonly IJwtService _jwtService;

    public AccountController(
        IAccountService accountService,
        IJwtService jwtService
        )
    {
        _accountService = accountService;
        _jwtService = jwtService;
    }

    [AllowAnonymous]
    [HttpPost("login")]

    public async Task<IActionResult> Login([FromBody] GoogleTokenRequest request)
    {
        try
        {
            // Verify the Google ID Token
            var payload = await GoogleJsonWebSignature.ValidateAsync(request.IdToken);

            if (payload == null || string.IsNullOrEmpty(payload.Email))
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Data = null,
                    Message = "Invalid Google token."
                });
            }

            // Check if the user already exists
            var user = await _accountService.GetByEmailAsync(payload.Email);
            bool isNewUser = false;

            if (user == null)
            {
                user = await _accountService.RegisterAsync(payload.Email, payload.Name);
                isNewUser = true;
            }

            var token = _jwtService.GenerateToken(user.Id, user.Email!);
            var refreshToken = _jwtService.GenerateRefreshToken();

            // Persist refresh token (valid for 30 days)
            await _accountService.UpdateRefreshTokenAsync(user.Id, refreshToken, DateTime.UtcNow.AddDays(30));

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Data = new
                {
                    user = new
                    {
                        id = user.Id,
                        email = user.Email,
                        name = user.Name
                    },
                    token = token,
                    refreshToken = refreshToken
                },
                Message = isNewUser ? "User registered successfully." : "User logged in successfully."
            });
        }
        catch (InvalidJwtException)
        {
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Data = null,
                Message = "Invalid Google token signature."
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Data = null,
                Message = $"An error occurred: {ex.Message}"
            });
        }
    }

    [AllowAnonymous]
    [HttpPost("refreshToken")]

    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        try
        {
            var user = await _accountService.GetByRefreshTokenAsync(request.RefreshToken);
            if (user == null || user.RefreshTokenExpiry < DateTime.UtcNow)
            {
                return Unauthorized(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Invalid or expired refresh token."
                });
            }

            var newToken = _jwtService.GenerateToken(user.Id, user.Email!);
            var newRefreshToken = _jwtService.GenerateRefreshToken();

            // Rotate refresh token
            await _accountService.UpdateRefreshTokenAsync(user.Id, newRefreshToken, DateTime.UtcNow.AddDays(30));

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Data = new
                {
                    token = newToken,
                    refreshToken = newRefreshToken
                },
                Message = "Token refreshed successfully."
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = $"An error occurred: {ex.Message}"
            });
        }
    }
}

public class RefreshTokenRequest
{
    public string RefreshToken { get; set; } = string.Empty;
}
