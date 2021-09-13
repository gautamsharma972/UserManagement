using System.Collections.Generic;

namespace UserManagement.Core
{
    public class ServiceResult
    {
        public List<string> Errors { get; set; }

        public bool IsSuccessful => Errors == null || Errors.Count <= 0;

        public object Extras { get; set; }

        public string RefId { get; set; }

        public object Data { get; set; }

        public string Message { get; set; }

        public ServiceResult(string message = "")
        {
            this.Message = message;
        }

    }
}
