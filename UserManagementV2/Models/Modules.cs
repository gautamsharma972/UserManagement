using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UserManagement.Models
{
    public class Modules
    {
        [MaxLength(36)]
        public string Id { get; set; }

        public string Name { get; set; }

        public string Description { get; set; }

        [NotMapped]
        public bool Checked { get; set; }

        public virtual ICollection<ModuleOperations> ModuleOperations { get; set; }
    }

    public class ModuleOperations
    {
        [MaxLength(36)]
        public string Id { get; set; }

        public string Name { get; set; }

        public virtual Modules Modules { get; set; }

        public string Description { get; set; }

        [NotMapped]
        public bool Checked { get; set; }

        [NotMapped]
        public string ModuleId { get; set; }
        public virtual ICollection<ModulePermission> Permissions { get; set; }
    }

    public class ModulePermission
    {
        [MaxLength(36)]
        public string Id { get; set; }

        public string Permissions { get; set; }

        public string Description { get; set; }

        public ModuleOperations ModuleOperations { get; set; }

        [NotMapped]
        public string OperationId { get; set; }
        [NotMapped]
        public bool Checked { get; set; }
    }
}
