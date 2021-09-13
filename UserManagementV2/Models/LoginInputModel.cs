using System;

namespace UserManagement.Models
{
    public class LoginInputModel
    {
        public string PhoneNumber { get; set; }

        public string OTP { get; set; }

        public DateTime TimeGenerated { get; set; }

        public string Email { get; set; }
        public string Password { get; set; }
        public LoginInputModel(string phoneNumber, string otp)
        {
            this.PhoneNumber = phoneNumber;
            this.OTP = otp;
        }
    }
}
