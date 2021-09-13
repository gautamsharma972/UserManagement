using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace UserManagement.Models
{
    public class ApplicationUser : IdentityUser
    {
        public string CreatedBy { get; set; }

        public string UpdatedBy { get; set; }

        public DateTime CreatedOn { get; set; }

        public DateTime UpdatedOn { get; set; }

        public string FirstName { get; set; }

        public string LastName { get; set; }

        [NotMapped]
        public virtual List<string> UserRoles { get; set; }

        public bool IsActive { get; set; }

        [NotMapped]
        public virtual List<UserPermissionsMapper> ModulePermissions { get; set; }


    }
}
