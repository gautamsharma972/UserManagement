using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;
using UserManagement.Models;
using UserManagement.Services.User;

namespace UserManagement.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;

        private readonly IUserService _userService;

        public UserController(UserManager<ApplicationUser> userManager,
            IUserService userService)
        {
            _userManager = userManager;
            _userService = userService;
        }

        [HttpGet("loggedUser")]
        public IActionResult GetLoggedUser()
        {
            return Ok(_userService.User);
        }

        [HttpGet]
        public async Task<IActionResult> GetUsers()
        {
            return Ok(await _userService.GetUsers(_userManager));
        }

        [HttpGet("{userId}")]
        public async Task<IActionResult> GetUserById(string userId)
        {
            if (string.IsNullOrEmpty(userId))
                throw new ArgumentNullException(nameof(userId));

            return Ok(await _userService.GetUser(userId, _userManager));
        }

        [HttpPost("toggleStatus/{userId}")]
        public async Task<IActionResult> ToggleUserStatus(string userId)
        {
            if (string.IsNullOrEmpty(userId))
                throw new ArgumentNullException(nameof(userId));
            return Ok(await _userService.ToggleStatus(userId, _userManager));
        }

    }
}
