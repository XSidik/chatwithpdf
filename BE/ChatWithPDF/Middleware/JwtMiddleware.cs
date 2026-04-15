using ChatWithPDF.Services;
using Microsoft.AspNetCore.Http;
using System.Linq;
using System.Threading.Tasks;

namespace ChatWithPDF.Middleware
{
    public class JwtMiddleware
    {
        private readonly RequestDelegate _next;

        public JwtMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task Invoke(HttpContext context, IJwtService jwtService)
        {
            var token = context.Request.Headers["Authorization"].FirstOrDefault()?.Split(" ").Last();

            if (token != null)
            {
                var userId = jwtService.ValidateToken(token);
                if (userId != null)
                {
                    // Attach userId to context on successful jwt validation
                    context.Items["UserId"] = userId;
                }
            }

            await _next(context);
        }
    }
}
