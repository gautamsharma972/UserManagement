using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using UserManagement.Models;

namespace UserManagement.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Modules> Modules { get; set; }
        public DbSet<ModuleOperations> ModulesOperations { get; set; }
        public DbSet<RolesPermissionMapper> RolesPermissionMappers { get; set; }
        public DbSet<UserPermissionsMapper> UserPermissionMappers { get; set; }
        public DbSet<ModulePermission> ModulePermissions { get; set; }
        public DbSet<RecentActions> RecentActions { get; set; }
    }
}
