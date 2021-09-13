using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace UserManagement.Models
{
    public class UpdateUserRolesModel
    {
        [Required]
        public ApplicationUser User { get; set; }

        [Required]
        public List<string> Roles { get; set; }
    }
}