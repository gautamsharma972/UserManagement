using System.ComponentModel.DataAnnotations;

namespace UserManagement.Models
{
    public class UserPermissionsMapper
    {
        [MaxLength(36)]
        public string Id { get; set; }

        public ModulePermission Permissions { get; set; }

        public ApplicationUser AppUser { get; set; }
    }
}
