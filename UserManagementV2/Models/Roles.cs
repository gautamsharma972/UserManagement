using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace UserManagement.Models
{
    public class RolesInputModel
    {
        public string Id { get; set; }

        [Required(ErrorMessage = "RoleName is required")]
        public string Name { get; set; }

        public List<SelectedModules> Modules { get; set; }

        public bool Checked { get; set; }

        public List<ModulePermission> Permissions { get; set; }
    }

}
