using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;
using UserManagement.Data;
using UserManagement.Models;
using UserManagement.Services;

namespace UserManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        readonly UserManager<ApplicationUser> _userManager;
        readonly RoleManager<IdentityRole> _roleManager;

        private readonly IAuthService _authService;
        readonly ApplicationDbContext _db;
        public AuthController(IAuthService authService,
            UserManager<ApplicationUser> userManager,
            ApplicationDbContext db,
            RoleManager<IdentityRole> roleManager)
        {
            _authService = authService;
            _userManager = userManager;
            _roleManager = roleManager;
            _db = db;
        }

        [HttpGet("{phoneNumber}")]
        public async Task<IActionResult> Login(string phoneNumber)
        {
            if (string.IsNullOrEmpty(phoneNumber))
                throw new ArgumentNullException(phoneNumber);

            return Ok(await _authService.GenerateOTP(phoneNumber, _userManager));
        }

        [HttpPost("Verify")]
        public IActionResult Verify(LoginInputModel values)
        {
            var _result = _authService.Verify(values, HttpContext.Request.Headers, _userManager, _roleManager, _db);
            if (_result.Status == TaskStatus.Faulted)
            {
                return BadRequest(_result.Status);
            }
            return Ok(_result);
        }

        [HttpPost("Logout/{phoneNumber}")]
        public IActionResult Logout(string phoneNumber)
        {
            _authService.Logout(phoneNumber);
            return Ok();
        }

        [HttpPost("Register")]
        public async Task<IActionResult> Register([FromBody] UserEditInput model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            return Ok(await _authService.Register(model, _userManager, _db));
        }

        [HttpPost("Roles/Create")]
        public async Task<IActionResult> CreateRoles(RolesInputModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            return Ok(await _authService.CreateRole(model, _roleManager, _db));
        }

        [HttpPut("Roles/Edit/{id}")]
        public async Task<IActionResult> UpdateRoles(string id, RolesInputModel model)
        {
            if (id == null)
                return BadRequest();
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            return Ok(await _authService.UpdateRole(model, _roleManager, _db));
        }

        [HttpGet("Roles")]
        public async Task<IActionResult> GetRoles()
        {
            return Ok(await _authService.GetRoles(_db));
        }

        [HttpGet("Roles/{role}")]
        public async Task<IActionResult> GetRoles(string role)
        {
            return Ok(await _authService.GetRoles(role, _db));
        }


        [HttpGet("Modules")]
        public async Task<IActionResult> Modules()
        {
            return Ok(await _authService.GetModules(_db));
        }

        [HttpGet("Modules/{moduleId}")]
        public async Task<IActionResult> Modules(string moduleId)
        {
            return Ok(await _authService.GetModules(moduleId, _db));
        }

        [HttpGet("Operations/{moduleId}")]
        public async Task<IActionResult> Operations(string moduleId)
        {
            return Ok(await _authService.GetOperations(moduleId, _db));
        }

        [HttpGet("Operations")]
        public async Task<IActionResult> Operations()
        {
            return Ok(await _authService.GetOperations(_db));
        }

        [HttpPost("Modules")]
        public async Task<IActionResult> SaveModules(Modules modules)
        {
            return Ok(await _authService.CreateModules(modules, _db));
        }

        [HttpPut("Modules/{moduleId}")]
        public async Task<IActionResult> EditModules(string moduleId, Modules modules)
        {
            return Ok(await _authService.EditModules(moduleId, modules, _db));
        }

        [HttpDelete("Modules/{moduleId}")]
        public async Task<IActionResult> DeleteModule(string moduleId)
        {
            return Ok(await _authService.DeleteModules(moduleId, _db));
        }

        [HttpGet("users/{role}")]
        public async Task<IActionResult> UsersByRole(string role)
        {
            return Ok(await _authService.GetUserRoles(role, _roleManager, _userManager));
        }

        [HttpPut("users/{id}")]
        public async Task<IActionResult> UpdateUser(string id, UserEditInput model)
        {
            if (id == null)
                throw new ArgumentNullException(id);
            return Ok(await _authService.UpdateUser(model, _db, _userManager));
        }

        [HttpGet("RecentActions")]
        public async Task<IActionResult> RecentActions()
        {
            return Ok(await _authService.GetRecentActions(_db));
        }

        [HttpDelete("Permissions/Delete/{permissionId}")]
        public async Task<IActionResult> DeletePermissions(string permissionId)
        {

            return Ok(await _authService.DeletePermissions(permissionId, _db));
        }

        [HttpPost("Permissions/Create")]
        public async Task<IActionResult> CreatePermissions(ModulePermission permission)
        {
            return Ok(await _authService.CreatePermissions(permission, _db));
        }

        [HttpPut("Permissions/Edit/{permissionId}")]
        public async Task<IActionResult> EditPermissions(string permissionId, ModulePermission permission)
        {
            if (string.IsNullOrEmpty(permissionId))
            {
                throw new ArgumentNullException(permissionId);
            }
            return Ok(await _authService.EditPermissions(permission, _db));
        }

        [HttpPost("Operations/Create")]
        public async Task<IActionResult> CreateOperations(ModuleOperations operations)
        {
            return Ok(await _authService.CreateOperations(operations, _db));
        }

        [HttpPut("Operations/Edit/{operationId}")]
        public async Task<IActionResult> EditOperations(string operationId, ModuleOperations operation)
        {
            if (string.IsNullOrEmpty(operationId))
                throw new ArgumentNullException(operationId);

            return Ok(await _authService.EditOperations(operation, _db));
        }

        [HttpDelete("Operations/Delete/{operationId}")]
        public async Task<IActionResult> DeleteOperations(string operationId)
        {
            return Ok(await _authService.DeleteOperation(operationId, _db));
        }

        [HttpPost("UpdateUserRoles")]
        public async Task<IActionResult> UpdateUserRoles(UpdateUserRolesModel updateUserRoles)
        {
            return Ok(await _authService.UpdateUser(updateUserRoles, _userManager));
        }
    }
}
