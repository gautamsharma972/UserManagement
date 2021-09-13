using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace UserManagement.Models
{
    public class UserEditInput
    {
        public string Id { get; set; }

        [Required(ErrorMessage = "UserName is required")]
        public string FirstName { get; set; }

        [Required]
        public string LastName { get; set; }

        public string PhoneNumber { get; set; }

        public bool IsActive { get; set; }

        public virtual ICollection<RolesInputModel> Roles { get; set; }

        public List<SelectedModules> Modules { get; set; }

        public string Password { get; set; }
        public string Email { get; set; }
    }

    public class SelectedModules
    {
        public string Id { get; set; }

        public string Name { get; set; }

        public bool Checked { get; set; }

        public virtual ICollection<SelectedOperations> ModuleOperations { get; set; }
    }

    public class SelectedOperations
    {
        public string Id { get; set; }

        public string Name { get; set; }

        public bool Checked { get; set; }

        public virtual ICollection<SelectedPermissions> Permissions { get; set; }
    }

    public class SelectedPermissions
    {
        public bool Checked { get; set; }

        public string Id { get; set; }

        public string Permissions { get; set; }
    }
}
