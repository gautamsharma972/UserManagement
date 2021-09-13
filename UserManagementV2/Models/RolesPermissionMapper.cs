using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace UserManagement.Models
{
    public class RolesPermissionMapper
    {
        [MaxLength(36)]
        public string Id { get; set; }

        public IdentityRole Roles { get; set; }

        public ModulePermission Permissions { get; set; }
    }
}
