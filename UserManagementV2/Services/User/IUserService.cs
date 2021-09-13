using Microsoft.AspNetCore.Identity;
using System.Collections.Generic;
using System.Threading.Tasks;
using UserManagement.Core;
using UserManagement.Models;

namespace UserManagement.Services.User
{
    public interface IUserService
    {
        ApplicationUser User { get; }

        Task<ApplicationUser> GetUser(string userId, UserManager<ApplicationUser> _userManager);

        Task<List<ApplicationUser>> GetUsers(UserManager<ApplicationUser> _userManager);

        Task<ApplicationUser> GetUserByPhoneNumber(string phoneNumber);

        Task<ServiceResult> ToggleStatus(string id, UserManager<ApplicationUser> _userManager);


    }
}
