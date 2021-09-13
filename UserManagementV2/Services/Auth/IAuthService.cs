using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Immutable;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Threading.Tasks;
using UserManagement.Core;
using UserManagement.Data;
using UserManagement.Models;

namespace UserManagement.Services
{
    public interface IAuthService
    {
        IImmutableDictionary<string, RefreshToken> UsersRefreshTokensReadOnlyDictionary { get; }

        JwtAuthResult GenerateTokens(string username, Claim[] claims, DateTime now);

        JwtAuthResult Refresh(string refreshToken, string accessToken, DateTime now);

        void RemoveExpiredRefreshTokens(DateTime now);

        void RemoveRefreshToken(string userName);

        (ClaimsPrincipal, JwtSecurityToken) DecodeJwtToken(string token);

        Task<ServiceResult> GenerateOTP(string phoneNumber, UserManager<ApplicationUser> userManager);

        Task<object> Verify(LoginInputModel values, IHeaderDictionary headers,
            UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager, ApplicationDbContext db);

        Task<ServiceResult> GetRoles(string role, ApplicationDbContext db);

        Task<ServiceResult> Register(UserEditInput model, UserManager<ApplicationUser> userManager, ApplicationDbContext _db);

        Task<ServiceResult> CreateModules(Modules modules, ApplicationDbContext db);

        Task<ServiceResult> EditModules(string moduleId, Modules modules, ApplicationDbContext db);

        Task<ServiceResult> DeleteModules(string moduleId, ApplicationDbContext db);

        Task<ServiceResult> CreateRole(RolesInputModel model, RoleManager<IdentityRole> roleManager,
            ApplicationDbContext _db);

        Task<ServiceResult> UpdateRole(RolesInputModel model, RoleManager<IdentityRole> roleManager,
            ApplicationDbContext _db);

        Task<ServiceResult> GetRoles(ApplicationDbContext db);

        Task<ServiceResult> GetModules(ApplicationDbContext db);

        Task<ServiceResult> GetModules(string moduleId, ApplicationDbContext db);

        Task<ServiceResult> GetUserRoles(string role, RoleManager<IdentityRole> roleManager,
            UserManager<ApplicationUser> userManager);
        Task<ServiceResult> GetRecentActions(ApplicationDbContext db);

        Task<ServiceResult> GetOperations(string moduleId, ApplicationDbContext db);

        Task<ServiceResult> GetOperations(ApplicationDbContext db);
        Task<ServiceResult> CreateOperations(ModuleOperations operations, ApplicationDbContext db);

        Task<ServiceResult> UpdateUser(UserEditInput user, ApplicationDbContext db, UserManager<ApplicationUser> _userManager);
        Task<ServiceResult> DeletePermissions(string permissionId, ApplicationDbContext db);
        Task<ServiceResult> UpdateUser(UpdateUserRolesModel updateUserRoles, UserManager<ApplicationUser> userManager);
        Task<ServiceResult> EditOperations(ModuleOperations operation, ApplicationDbContext db);
        Task<ServiceResult> EditPermissions(ModulePermission permission, ApplicationDbContext db);

        void Logout(string phoneNumber);
        Task<ServiceResult> DeleteOperation(string operationId, ApplicationDbContext db);
        Task<ServiceResult> CreatePermissions(ModulePermission permissions, ApplicationDbContext db);
    }
}
