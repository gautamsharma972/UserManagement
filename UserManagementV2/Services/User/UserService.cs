using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using UserManagement.Core;
using UserManagement.Data;
using UserManagement.Models;

namespace UserManagement.Services.User
{
    class UserService : IUserService, IDisposable
    {
        private readonly ApplicationDbContext _db;
        private readonly string _rootUserRole = "SibinAdmin";
        private IHttpContextAccessor _httpContext;
        public UserService(ApplicationDbContext db,
            IHttpContextAccessor httpContext)
        {
            _db = db;
            _httpContext = httpContext;
        }

        private ApplicationUser _user;

        public ApplicationUser User
        {
            get
            {
                var currentUser = _user ?? _db.Users.SingleOrDefault(a => a.UserName ==
                _httpContext.HttpContext.User.Identity.Name);
                if (currentUser == null)
                    currentUser = new ApplicationUser() { UserName = "Need to Login" };
                return (ApplicationUser)currentUser;
            }
        }

        public async Task<ApplicationUser> GetUser(string userId, UserManager<ApplicationUser> _userManager)
        {
            var user = await _userManager.FindByIdAsync(userId);
            user.UserRoles = (List<string>)await _userManager.GetRolesAsync(user);
            user.ModulePermissions =
                await _db.UserPermissionMappers.
                Include(a => a.Permissions).ThenInclude(a => a.ModuleOperations).ThenInclude(a => a.Modules)
                .Where(a => a.AppUser.Id == user.Id).ToListAsync();

            foreach (var item in user.ModulePermissions.Where(item => item.Permissions != null))
            {
                item.Permissions.ModuleOperations.Checked = true;
            }

            foreach (var mod in user.ModulePermissions.Where(mod => mod.Permissions != null))
            {
                mod.Permissions.ModuleOperations.Checked = true;
                mod.Permissions.ModuleOperations.Modules.Checked = true;
                foreach (var m in mod.Permissions.ModuleOperations.Modules.ModuleOperations)
                {
                    m.Checked = true;
                    foreach (var p in m.Permissions)
                    {
                        p.Checked = true;
                    }
                }
            }

            return user;

        }

        public async Task<List<ApplicationUser>> GetUsers(UserManager<ApplicationUser> _userManager)
        {
            var users = await _userManager.Users.ToListAsync();

            if (!_httpContext.HttpContext.User.IsInRole(_rootUserRole))
            {
                var _rootUsers = await _userManager.GetUsersInRoleAsync(_rootUserRole);
                users = users.Where(a => !_rootUsers.Any(b => b.Id == a.Id)).ToList();
            }

            foreach (var user in users)
            {
                user.UserRoles = (List<string>)await _userManager.GetRolesAsync(user);
            }
            return users;

        }

        public async Task<ApplicationUser> GetUserByPhoneNumber(string phoneNumber)
        {
            return (ApplicationUser)await _db.Users.SingleOrDefaultAsync(a => a.PhoneNumber == phoneNumber);
        }

        public async Task<ServiceResult> ToggleStatus(string userId, UserManager<ApplicationUser> _userManager)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return new ServiceResult("No user found")
                {
                    Errors = new List<string>
                    {
                        $"No user found with Email => {userId}"
                    }
                };
            }
            user.IsActive = !user.IsActive;
            var result = await _userManager.UpdateAsync(user);
            return new ServiceResult
            {
                Errors = result.Succeeded ? null : result.Errors.Select(a => a.Description).ToList(),
                Data = result.Succeeded ? user : null
            };
        }

        public void Dispose()
        {
            this.Dispose();
        }
    }
}
