using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Primitives;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json;
using OtpNet;
using RestSharp;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using UserManagement.Core;
using UserManagement.Data;
using UserManagement.Models;

namespace UserManagement.Services
{
    class AuthService : IAuthService
    {
        #region Private Members
        private const string _smsSessionKey = "_@SMS.OTP";
        private readonly string _rootUserRole = "SibinAdmin";
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly SMSSettings _smsSettings;
        public IImmutableDictionary<string, RefreshToken> UsersRefreshTokensReadOnlyDictionary =>
            _usersRefreshTokens.ToImmutableDictionary();
        private readonly ConcurrentDictionary<string, RefreshToken> _usersRefreshTokens;
        private readonly JWTSettings _jwtSettings;
        private readonly byte[] _secret;
        private readonly ILogger<AuthService> _logger;

        private ISession _session => _httpContextAccessor.HttpContext.Session;
        #endregion

        public AuthService(
            IHttpContextAccessor httpContextAccessor,
            ILogger<AuthService> logger,
            SMSSettings sMSSettings,
            JWTSettings jWTSettings)
        {
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
            _jwtSettings = jWTSettings;
            _smsSettings = sMSSettings;
            _usersRefreshTokens = new ConcurrentDictionary<string, RefreshToken>();
            _secret = Encoding.ASCII.GetBytes(_jwtSettings.SecretKey);
        }

        #region Public Methods

        public void RemoveExpiredRefreshTokens(DateTime now)
        {
            var expiredTokens = _usersRefreshTokens.
          Where(x => x.Value.ExpireAt < now).ToList();
            foreach (var expiredToken in expiredTokens)
            {
                _usersRefreshTokens.TryRemove(expiredToken.Key, out _);
            }
        }

        public void RemoveRefreshToken(string phoneNumber)
        {
            var refreshTokens = _usersRefreshTokens.
           Where(x => x.Value.PhoneNumber == phoneNumber).ToList();
            foreach (var refreshToken in refreshTokens)
            {
                _usersRefreshTokens.TryRemove(refreshToken.Key, out _);
            }
        }

        public JwtAuthResult GenerateTokens(string phoneNumber, Claim[] claims, DateTime now)
        {
            var shouldAddAudienceClaim = string.IsNullOrWhiteSpace(claims?.FirstOrDefault(x => x.Type == JwtRegisteredClaimNames.Aud)?.Value);
            var jwtToken = new JwtSecurityToken(
                _jwtSettings.Issuer,
                shouldAddAudienceClaim ? _jwtSettings.Audience : string.Empty,
                claims,
                expires: now.AddDays(_jwtSettings.AccessTokenExpiration),
                signingCredentials: new SigningCredentials(new SymmetricSecurityKey(_secret), SecurityAlgorithms.HmacSha256Signature));

            var accessToken = new JwtSecurityTokenHandler().WriteToken(jwtToken);

            var refreshToken = new RefreshToken
            {
                PhoneNumber = phoneNumber,
                TokenString = GenerateRefreshTokenString(),
                ExpireAt = now.AddDays(_jwtSettings.RefreshTokenExpiration)
            };
            var _tokenString = refreshToken.TokenString;
            _usersRefreshTokens.AddOrUpdate(_tokenString, refreshToken, (_tokenString, refreshToken) => refreshToken);

            return new JwtAuthResult
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken
            };

        }

        public JwtAuthResult Refresh(string refreshToken, string accessToken, DateTime now)
        {
            var (principal, jwtToken) = DecodeJwtToken(accessToken);
            if (jwtToken == null || !jwtToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256Signature))
            {
                throw new SecurityTokenException("Invalid token");
            }

            var phoneNumber = principal.Identity?.Name;
            if (!_usersRefreshTokens.TryGetValue(refreshToken, out var existingRefreshToken))
            {
                throw new SecurityTokenException("Invalid token");
            }
            if (existingRefreshToken.PhoneNumber != phoneNumber || existingRefreshToken.ExpireAt < now)
            {
                throw new SecurityTokenException("Invalid token");
            }

            return GenerateTokens(phoneNumber, principal.Claims.ToArray(), now);

        }

        public (ClaimsPrincipal, JwtSecurityToken) DecodeJwtToken(string token)
        {
            if (string.IsNullOrWhiteSpace(token))
            {
                throw new SecurityTokenException("Invalid token");
            }
            var principal = new JwtSecurityTokenHandler()
                .ValidateToken(token,
                    new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidIssuer = _jwtSettings.Issuer,
                        ValidateIssuerSigningKey = true,
                        IssuerSigningKey = new SymmetricSecurityKey(_secret),
                        ValidAudience = _jwtSettings.Audience,
                        ValidateAudience = true,
                        ValidateLifetime = true,
                        ClockSkew = TimeSpan.FromMinutes(1)
                    },
                    out var validatedToken);
            return (principal, validatedToken as JwtSecurityToken);

        }

        public async Task<ServiceResult> GenerateOTP(string phoneNumber, UserManager<ApplicationUser> _userManager)
        {
            var userExists = await _userManager.Users.
           AnyAsync(r => r.PhoneNumber == phoneNumber);
            if (!userExists)
            {
                List<string> _errors = new List<string>
                    {
                        "User not found"
                    };
                return new ServiceResult("User not found")
                {
                    Errors = _errors
                };
            }
            var key = KeyGeneration.GenerateRandomKey(6);
            var base32String = Base32Encoding.ToString(key);
            var base32Bytes = Base32Encoding.ToBytes(base32String);
            var otp = new Totp(base32Bytes);
            var smsOptions = new LoginInputModel(phoneNumber, otp.ComputeTotp()) { TimeGenerated = DateTime.Now };
            Core.SessionExtensions.SetObjectAsJson(_session, _smsSessionKey, smsOptions);

            return await SendOTP(smsOptions);

        }

        public async Task<object> Verify(LoginInputModel values,
            IHeaderDictionary header, UserManager<ApplicationUser> _userManager,
            RoleManager<IdentityRole> _roleManager, ApplicationDbContext _db)
        {
            if (!string.IsNullOrEmpty(values.Email))
            {
                if (!string.IsNullOrEmpty(values.Password))
                {
                    var user = await _userManager.FindByEmailAsync(values.Email.Trim());
                    if (user == null)
                    {
                        return new
                        {
                            error = true,
                            message = "No users found with this Email Id. Please try again."
                        };
                    }
                    var isValidLogin = await _userManager.CheckPasswordAsync(user, values.Password);

                    if (isValidLogin)
                    {
                        return await GetUserPermissions(values, _userManager, _roleManager, _db, user);
                    }
                    return new
                    {
                        error = true,
                        message = "Invalid Password, please try again."
                    };
                }
                return new
                {
                    error = true,
                    message = "Password is required, if you're login using your Email Id"
                };
            }

            if (!string.IsNullOrEmpty(values.PhoneNumber))
                return await OTPLogin(values, header, _userManager, _roleManager, _db);
            return new
            {
                error = true,
                message = "Provide Email Id or Phone number to login"
            };
        }

        private async Task<object> OTPLogin(LoginInputModel values,
            IHeaderDictionary header, UserManager<ApplicationUser> _userManager,
            RoleManager<IdentityRole> _roleManager, ApplicationDbContext _db)
        {
            _ = new StringValues();
            header.TryGetValue("_session", out StringValues _uData);
            var _oData = Encrypter.DecryptString(_uData);
            var _smsOtps = JsonConvert.DeserializeObject<LoginInputModel>(_oData);
            if (_smsOtps == null)
            {
                _logger.LogInformation($"Session was not created for user => {values}");
                return new
                {
                    error = true,
                    message = "No session created!"
                };
            }
            if (_smsOtps.OTP == values.OTP)
            {
                if (_smsOtps.TimeGenerated.AddMinutes(1).TimeOfDay <= DateTime.Now.TimeOfDay)
                {
                    return new
                    {
                        error = true,
                        phoneNumber = values.PhoneNumber,
                        message = "OTP Expired! Click Resend to generate new OTP."
                    };
                }
                var _user = await _userManager.Users.SingleOrDefaultAsync(a => a.PhoneNumber == values.PhoneNumber);
                if (_user == null)
                {
                    return new
                    {
                        error = true,
                        phoneNumber = values.PhoneNumber,
                        id = _user.Id
                    };
                }

                return await GetUserPermissions(values, _userManager, _roleManager, _db, _user);
            }
            return new
            {
                error = true,
                message = "Invalid OTP. Please try again."
            };
        }

        private async Task<object> GetUserPermissions(LoginInputModel values, UserManager<ApplicationUser> _userManager,
            RoleManager<IdentityRole> _roleManager, ApplicationDbContext _db, ApplicationUser _user)
        {
            _user.ModulePermissions =
              await _db.UserPermissionMappers.
              Include(a => a.Permissions).ThenInclude(a => a.ModuleOperations).ThenInclude(a => a.Modules)
              .Where(a => a.AppUser.Id == _user.Id).ToListAsync();

            var roles = await _userManager.GetRolesAsync(_user);
            var userRoles = roles.Select(r => new Claim(ClaimTypes.Role, r)).ToArray();
            var userClaims = await _userManager.GetClaimsAsync(_user).ConfigureAwait(false);
            var roleClaims = await GetRoleClaims(roles, _roleManager).ConfigureAwait(false);
            var claims = new[]  {
                new Claim(ClaimTypes.NameIdentifier, _user.Id.ToString()),
                new Claim(ClaimTypes.MobilePhone, _user.PhoneNumber?? _user.Email),
                new Claim(ClaimTypes.Name, _user.UserName)
            }.Union(userClaims).Union(roleClaims).Union(userRoles);

            var _accessToken = GenerateTokens(values.PhoneNumber, claims.ToArray(), DateTime.Now.AddMinutes(-1));
            _session.SetString("_userSession", JsonConvert.SerializeObject(_accessToken));
            return new
            {
                error = false,
                access_token = _accessToken,
                phoneNumber = values.PhoneNumber,
                user = _user
            };
        }

        public void Logout(string phoneNumber)
        {
            RemoveRefreshToken(phoneNumber);
            _logger.LogInformation($"User [{phoneNumber}] logged out the system.");
        }

        public async Task<ServiceResult> Register(UserEditInput model,
            UserManager<ApplicationUser> _userManager, ApplicationDbContext _db)
        {
            model.Email = model.Email == "" ? null : model.Email;
            model.Password = model.Password == "" ? null : model.Password;
            model.PhoneNumber = model.PhoneNumber == "" ? null : model.PhoneNumber;

            List<string> _errors = new List<string>();

            var random = new Random();

            if (!string.IsNullOrEmpty(model.Email))
            {
                if (string.IsNullOrEmpty(model.Password))
                {
                    _errors.Add($"Password is required if Login type is Password based.");
                    return new ServiceResult()
                    {
                        Errors = _errors
                    };
                }
            }

            if (string.IsNullOrEmpty(model.Email) && string.IsNullOrEmpty(model.PhoneNumber))
            {
                _errors.Add($"Provide either Phone Number or Email to register.");
                return new ServiceResult()
                {
                    Errors = _errors
                };
            }

            if (model.PhoneNumber != null)
            {
                var userExists = await _userManager.Users.
               SingleOrDefaultAsync(r => r.PhoneNumber == model.PhoneNumber);
                if (userExists != null)
                {
                    _errors.Add($"User with {model.PhoneNumber} already exists! Try again with another number");
                    return new ServiceResult()
                    {
                        Errors = _errors
                    };
                }
            }

            if (model.Email != null)
            {
                var userExists = await _userManager.Users.SingleOrDefaultAsync(a => a.Email == model.Email);
                if (userExists != null)
                {
                    _errors.Add($"User with {model.Email} already exists! Try again with another Email");
                    return new ServiceResult()
                    {
                        Errors = _errors
                    };
                }
            }

            var user = new ApplicationUser
            {
                Email = model.Email ?? $"predefined_{model.FirstName.Trim()}{model.LastName.Trim()}{random.Next(0, 999)}{DateTime.Now.Ticks}@power.com",
                UserName = $"{model.FirstName.Trim()}{model.LastName.Trim()}{random.Next(0, 999)}",
                PhoneNumber = model.PhoneNumber ?? null,
                IsActive = model.IsActive,
                FirstName = model.FirstName.Trim(),
                LastName = model.LastName.Trim(),
                CreatedOn = DateTime.Now,
                UpdatedOn = DateTime.Now
            };

            var result = (model.Password != null && model.Email != null)
                ? await _userManager.CreateAsync(user, model.Password)
                : await _userManager.CreateAsync(user);

            if (result.Succeeded)
            {
                List<string> roles = new List<string>();
                var permissions = new List<UserPermissionsMapper>();
                foreach (var mod in model.Roles.Where(a => a.Checked))
                {
                    roles.Add(mod.Name);
                    foreach (var permission in mod.Permissions.Where(a => a.Checked))
                    {
                        await MapPermissions(_db, user, permissions, permission.Id);
                    }
                }

                if (model.Modules != null)
                {
                    foreach (var per in model.Modules.SelectMany(selectedMod => selectedMod.ModuleOperations
                .SelectMany(selectedOp => selectedOp.Permissions.Where(a => a.Checked).ToList())))
                    {
                        await MapPermissions(_db, user, permissions, per.Id);
                    }
                }


                await _userManager.AddToRolesAsync(user, roles);
                await _db.UserPermissionMappers.AddRangeAsync(permissions);

                await _db.SaveChangesAsync();

                return new ServiceResult("User Created");
            }
            foreach (var item in result.Errors)
            {
                _errors.Add($"{item.Code}: {item.Description}");
            }
            _logger.LogError($"Error occurred creating user => {user}");
            return new ServiceResult("Error creating user")
            {
                Errors = _errors
            };

        }


        public async Task<ServiceResult> UpdateUser(UserEditInput userInput, ApplicationDbContext _db,
         UserManager<ApplicationUser> _userManager)
        {
            userInput.Email = userInput.Email == "" ? null : userInput.Email;
            userInput.Password = userInput.Password == "" ? null : userInput.Password;
            userInput.PhoneNumber = userInput.PhoneNumber == "" ? null : userInput.PhoneNumber;

            List<string> _errors = new List<string>();

            var user = await _userManager.FindByIdAsync(userInput.Id);

            if (user == null)
                return new ServiceResult("User not found")
                {
                    Errors = new List<string>()
                        {
                            $"User could not be found with {userInput.Id}"
                        }
                };

            if (userInput.PhoneNumber != null)
            {
                var userExists = await _userManager.Users.
                    SingleOrDefaultAsync(r => r.Id != userInput.Id && r.PhoneNumber == userInput.PhoneNumber);

                if (userExists != null)
                {
                    _errors.Add($"User with {userInput.PhoneNumber} already exists! Try again with another number");
                    return new ServiceResult()
                    {
                        Errors = _errors
                    };
                }
            }

            user.FirstName = userInput.FirstName;
            user.LastName = userInput.LastName;
            user.PhoneNumber = userInput.PhoneNumber;
            user.IsActive = userInput.IsActive;

            user.UpdatedOn = DateTime.Now;
            if (userInput.Email != null)
            {
                var checkMail = await _userManager.Users.SingleOrDefaultAsync(a => a.Id != userInput.Id
                && a.Email == userInput.Email);
                if (checkMail != null)
                {
                    _errors.Add($"User with {userInput.Email} already exists! Try again with another Email");
                    return new ServiceResult()
                    {
                        Errors = _errors
                    };
                }

                if (!user.Email.Equals(userInput.Email, StringComparison.OrdinalIgnoreCase))
                {
                    user.Email = userInput.Email;
                }
            }
            else
            {
                Random random = new Random();
                user.Email = $"predefined_{userInput.FirstName.Trim()}{userInput.LastName.Trim()}{random.Next(0, 999)}@power.com";
            }
            if (userInput.Roles != null)
            {
                var _roles = await _userManager.GetRolesAsync(user);
                if (_roles.Count > 0)
                    await _userManager.RemoveFromRolesAsync(user, _roles);

                var _permissions = await _db.UserPermissionMappers
                    .Include(a => a.AppUser).Where(a => a.AppUser.Id == user.Id).ToListAsync();
                if (_permissions.Count > 0)
                {
                    _db.UserPermissionMappers.RemoveRange(_permissions);
                }

                var _claims = await _userManager.RemoveClaimsAsync(user, await _userManager.GetClaimsAsync(user));

                List<string> roles = new List<string>();
                var permissions = new List<UserPermissionsMapper>();

                foreach (var mod in userInput.Roles.Where(a => a.Checked))
                {
                    roles.Add(mod.Name);
                    foreach (var permission in mod.Permissions.Where(a => a.Checked))
                    {
                        await MapPermissions(_db, user, permissions, permission.Id);
                    }
                }

                if (userInput.Modules != null && userInput.Modules.Count > 0)
                {
                    foreach (var per in userInput.Modules.SelectMany(selectedMod => selectedMod.ModuleOperations
                .SelectMany(selectedOp => selectedOp.Permissions.Where(a => a.Checked).ToList())))
                    {
                        await MapPermissions(_db, user, permissions, per.Id);
                    }

                }

                if (!string.IsNullOrEmpty(userInput.Password))
                {
                    await _userManager.RemovePasswordAsync(user);
                    await _userManager.AddPasswordAsync(user, userInput.Password);
                }

                await _userManager.AddToRolesAsync(user, roles);
                await _db.UserPermissionMappers.AddRangeAsync(permissions);

                await _db.SaveChangesAsync();
            }
            var result = await _userManager.UpdateAsync(user);
            return new ServiceResult(result.Succeeded ? "Saved" : result.Errors.GetEnumerator().Current.Description)
            {
                Errors = result.Succeeded ? null : new List<string>
                    {
                        result.Errors.GetEnumerator().Current.Description
                    }
            };

        }

        public async Task<ServiceResult> UpdateUser(UpdateUserRolesModel updateUserRoles,
            UserManager<ApplicationUser> userManager)
        {
            var user = await userManager.FindByIdAsync(updateUserRoles.User.Id);
            if (user == null)
                return new ServiceResult
                {
                    Errors = new List<string>
                    {
                        $"No user found with Id => {updateUserRoles.User.Id}"
                    }
                };
            var userRoles = await userManager.GetRolesAsync(user);
            if (userRoles.Count > 0)
            {
                await userManager.RemoveFromRolesAsync(user, userRoles);
            }
            var result = await userManager.AddToRolesAsync(user, updateUserRoles.Roles);
            return new ServiceResult
            {
                Errors = (List<string>)(result.Succeeded ? null : result.Errors.Select(a => a.Description))
            };
        }

        public async Task<ServiceResult> CreateRole(RolesInputModel model,
            RoleManager<IdentityRole> _roleManager, ApplicationDbContext _db)
        {
            if (await _roleManager.RoleExistsAsync(model.Name.ToLower().Trim()))
            {
                return new ServiceResult("Role already exists")
                {
                    Errors = new List<string>()
                        {
                            "Role already exists!"
                        }
                };
            }
            var role = new IdentityRole { Name = model.Name };
            var result = await _roleManager.CreateAsync(role);

            if (!result.Succeeded)
                return new ServiceResult(result.Errors.SingleOrDefault().Description)
                {
                    Errors = result.Errors.Select(a => a.Description).ToList()
                };

            var _rolePermissions = new List<RolesPermissionMapper>();
            foreach (var (module, operation, permission)
                in from module in model.Modules
                   from operation in module.ModuleOperations
                   from permission in operation.Permissions.Where(a => a.Checked)
                   select (module, operation, permission))
            {
                _rolePermissions.Add(new RolesPermissionMapper
                {
                    Id = Guid.NewGuid().ToString(),
                    Permissions = await _db.ModulePermissions.SingleOrDefaultAsync(a => a.Id == permission.Id),
                    Roles = role
                });
                await _roleManager.AddClaimAsync(role, new Claim(CustomClaimTypes.Permission, $"{module.Name}.{operation.Name}.{permission.Permissions}"));
            }

            await _db.RolesPermissionMappers.AddRangeAsync(_rolePermissions);

            await _db.SaveChangesAsync();
            return new ServiceResult("Role Created");

        }

        public async Task<ServiceResult> UpdateRole(RolesInputModel model,
            RoleManager<IdentityRole> _roleManager, ApplicationDbContext _db)
        {
            var role = await _roleManager.Roles.SingleOrDefaultAsync(a => a.Name == model.Name.Trim());

            if (role == null)
            {
                return new ServiceResult("Role doesn't exists!")
                {
                    Errors = new List<string>()
                        {
                            "Role doesn't exists!"
                        }
                };
            }

            role.Name = model.Name;

            var claims = await _roleManager.GetClaimsAsync(role);
            if (claims.Count > 0)
            {
                foreach (var item in claims)
                    await _roleManager.RemoveClaimAsync(role, item);
            }

            var _rolesModules = await _db.RolesPermissionMappers.
                Include(a => a.Roles).
                Where(a => a.Roles.Id == role.Id).ToListAsync();
            if (_rolesModules.Count > 0)
            {
                _db.RolesPermissionMappers.RemoveRange(_rolesModules);
            }

            await SetRolePermissions(model, _roleManager, _db, role);

            await _db.SaveChangesAsync();
            return new ServiceResult("Saved");

        }

        public async Task<ServiceResult> GetRoles(ApplicationDbContext db)
        {
            var roles = await db.Roles.ToListAsync();

            if (!_httpContextAccessor.HttpContext.User.IsInRole(_rootUserRole))
            {
                roles = await db.Roles.Where(a => a.Name != _rootUserRole).ToListAsync();
            }

            var model = (roles.Select(async role => new RolesViewModel
            {
                Roles = role,
                UsersCount = await db.UserRoles.Where(a => a.RoleId == role.Id).CountAsync() - 1,
                Permissions = await db.RolesPermissionMappers
                   .Include(a => a.Roles)
                   .Include(a => a.Permissions)
                   .ThenInclude(a => a.ModuleOperations)
                   .ThenInclude(a => a.Modules)
                   .Where(a => a.Roles.Id == role.Id)
                   .Select(a => a.Permissions)
                   .ToListAsync()
            })).ToList();

            foreach (var permission in model.Where(a => a.Result.Permissions != null).
                SelectMany(item => item.Result.Permissions.Where(permission => permission != null)))
            {
                permission.Checked = false;
            }

            return new ServiceResult
            {
                Data = model
            };

        }

        public async Task<ServiceResult> GetRoles(string role, ApplicationDbContext db)
        {
            var roles = await db.Roles.SingleOrDefaultAsync(a => a.Name == role);
            if (roles == null)
            {
                throw new ArgumentNullException(nameof(roles));
            }
            var model = new RolesViewModel
            {
                Roles = roles,
                Permissions = await db.RolesPermissionMappers
                    .Include(a => a.Roles)
                    .Include(a => a.Permissions)
                    .ThenInclude(a => a.ModuleOperations)
                    .ThenInclude(a => a.Modules)
                    .Where(a => a.Roles.Name == role)
                    .Select(a => a.Permissions)
                    .ToListAsync()
            };

            return new ServiceResult(roles == null ? "No Role found" : null)
            {
                Errors = roles == null ? new List<string>
                    {
                        $"No Role found with name => {role}"
                    } : null,
                Data = model ?? null
            };

        }

        public async Task<ServiceResult> GetModules(ApplicationDbContext _db)
        {
            try
            {
                var result = await _db.Modules.Include(a => a.ModuleOperations).
                    ThenInclude(a => a.Permissions).ToListAsync();
                foreach (var item in result)
                {
                    item.Checked = false;
                    foreach (var modOperation in item.ModuleOperations)
                    {
                        modOperation.Checked = false;
                        foreach (var permission in modOperation.Permissions)
                        {
                            permission.Checked = false;
                        }
                    }
                }
                return new ServiceResult
                {
                    Data = result
                };
            }
            catch (Exception ex)
            {
                return new ServiceResult(ex.Message)
                {
                    Errors = new List<string>()
                   {
                       $"Error: {ex.Message}"
                   },
                    Data = null
                };
            }

        }

        public async Task<ServiceResult> GetModules(string moduleId, ApplicationDbContext _db)
        {
            try
            {
                var module = await _db.Modules.Include(a => a.ModuleOperations)
                    .ThenInclude(a => a.Permissions).SingleOrDefaultAsync(a => a.Id == moduleId);
                if (module == null)
                {
                    return new ServiceResult()
                    {
                        Errors = new List<string>()
                        {
                            $"could not find Module with Id => {moduleId}"
                        }
                    };
                }

                return new ServiceResult
                {
                    Data = module
                };
            }
            catch (Exception ex)
            {
                return new ServiceResult(ex.Message)
                {
                    Errors = new List<string>()
                   {
                       $"Error: {ex.Message}"
                   }
                };
            }
        }

        public async Task<ServiceResult> GetOperations(string Id, ApplicationDbContext _db)
        {
            var result = await _db.Modules.Include(a => a.ModuleOperations).
          ThenInclude(a => a.Permissions)
          .SingleOrDefaultAsync(a => a.Id == Id);
            if (result == null)
                return new ServiceResult
                {
                    Errors = new List<string>
                        {
                            $"No Modules found with Id => {Id}"
                        }
                };
            return new ServiceResult()
            {
                Data = result
            };

        }

        public async Task<ServiceResult> GetOperations(ApplicationDbContext db)
        {
            var operations = await db.ModulesOperations.Include(a => a.Modules).ToListAsync();
            return new ServiceResult
            {
                Data = operations
            };
        }

        public async Task<ServiceResult> CreateModules(Modules modules, ApplicationDbContext db)
        {
            var module = await db.Modules.
                Where(a => a.Name.Replace(" ", "").ToLower() == modules.Name.Replace(" ", "").ToLower())
                .SingleOrDefaultAsync();
            if (module != null)
            {
                return new ServiceResult
                {
                    Errors = new List<string>
                        {
                            $"Module with same name already exists. Try another"
                        }
                };
            }
            modules.Id = Guid.NewGuid().ToString();
            await GetSetModuleOperations(modules, db);
            await db.Modules.AddAsync(modules);
            await db.SaveChangesAsync();
            return new ServiceResult("Saved");

        }

        public async Task<ServiceResult> EditModules(string moduleId, Modules modules, ApplicationDbContext db)
        {
            var module = await db.Modules.SingleOrDefaultAsync(a => a.Id == moduleId);
            var doesExistModule = await db.Modules.AnyAsync(a => a.Id != moduleId && a.Name.Replace(" ", "").ToLower() == modules.Name.Replace(" ", "").ToLower());
            if (doesExistModule)
            {
                return new ServiceResult
                {
                    Errors = new List<string>
                    {
                        $"Module with same name already exists. Try another"
                    }
                };
            }

            if (module == null)
            {
                return new ServiceResult
                {
                    Errors = new List<string>
                    {
                        $"No Module found with this Id => {moduleId}"
                    }
                };
            }
            module.Name = modules.Name;
            module.Description = modules.Description;
            await db.SaveChangesAsync();
            return new ServiceResult("Saved");
        }

        public async Task<ServiceResult> DeleteModules(string moduleId, ApplicationDbContext db)
        {
            var module = await db.Modules
              .Include(a => a.ModuleOperations)
              .ThenInclude(a => a.Permissions)
              .SingleOrDefaultAsync(a => a.Id == moduleId);
            if (module == null)
            {
                return new ServiceResult
                {
                    Errors = new List<string>
                    {
                        $"Module not found with Id => {moduleId}"
                    }
                };
            }

            var relatedUsers =
                   await db.UserPermissionMappers.
                   Include(a => a.Permissions).ThenInclude(a => a.ModuleOperations).ThenInclude(a => a.Modules)
                   .Where(a => a.Permissions.ModuleOperations.Modules.Id == moduleId).Select(a => a.AppUser).ToListAsync();

            var relatedRoles =
                await db.RolesPermissionMappers
                .Include(a => a.Permissions).ThenInclude(a => a.ModuleOperations).ThenInclude(a => a.Modules)
                .Where(a => a.Permissions.ModuleOperations.Modules.Id == moduleId).Select(a => a.Roles).ToListAsync();

            var errors = new List<string>();

            if (relatedUsers.Count > 0)
            {
                errors.Add($"Could not delete this module since {relatedUsers.Count} users are assigned with this module.");
            }

            if (relatedRoles.Count > 0)
            {
                errors.Add($"Could not delete this module since {relatedRoles.Count} roles are assigned with this module.");
            }

            if (errors.Count > 0)
            {
                return new ServiceResult
                {
                    Errors = errors,
                    Data = null
                };
            }

            if (module.ModuleOperations.Count > 0)
            {
                db.ModulesOperations.RemoveRange(module.ModuleOperations);
            }
            db.Modules.Remove(module);
            await db.SaveChangesAsync();
            return new ServiceResult("Deleted");
        }

        public async Task<ServiceResult> GetUserRoles(string role, RoleManager<IdentityRole> roleManager, UserManager<ApplicationUser> userManager)
        {
            var roles = await roleManager.FindByNameAsync(role);
            if (roles == null)
                return new ServiceResult
                {
                    Errors = new List<string>
                    {
                        $"No Roles found with {role}"
                    },
                    Data = null
                };

            var users = await userManager.GetUsersInRoleAsync(role);

            return new ServiceResult
            {
                Data = new
                {
                    users = users.ToList(),
                    role = roles
                }
            };
        }

        public async Task<ServiceResult> GetRecentActions(ApplicationDbContext db) => new ServiceResult
        {
            Data = await db.RecentActions.ToListAsync()
        };

        public async Task<ServiceResult> CreateOperations(ModuleOperations operations, ApplicationDbContext db)
        {
            operations.Modules = await db.Modules.SingleOrDefaultAsync(a => a.Id == operations.ModuleId);

            operations.Id = Guid.NewGuid().ToString();
            await db.ModulesOperations.AddAsync(operations);

            await db.SaveChangesAsync();
            return new ServiceResult("Saved");
        }

        public async Task<ServiceResult> EditOperations(ModuleOperations operations, ApplicationDbContext db)
        {
            var operation = await db.ModulesOperations.SingleOrDefaultAsync(a => a.Id == operations.Id);
            if (operation == null)
            {
                return new ServiceResult
                {
                    Errors = new List<string>
                    {
                        $"No Operation found with Id => {operations.Id}"
                    }
                };
            }

            operation.Modules = await db.Modules.SingleOrDefaultAsync(a => a.Id == operations.ModuleId);
            operation.Name = operations.Name;
            operation.Description = operation.Description;

            await db.SaveChangesAsync();
            return new ServiceResult("Saved");
        }

        public async Task<ServiceResult> DeleteOperation(string operationId, ApplicationDbContext db)
        {
            var operation = await db.ModulesOperations.Include(a => a.Permissions)
                .SingleOrDefaultAsync(a => a.Id == operationId);
            if (operation == null)
            {
                return new ServiceResult
                {
                    Errors = new List<string>
                    {
                        $"No Operation found with Id => {operationId}"
                    }
                };
            }
            if (operation.Permissions.Count > 0)
            {
                db.ModulePermissions.RemoveRange(operation.Permissions);
            }
            db.ModulesOperations.Remove(operation);
            await db.SaveChangesAsync();
            return new ServiceResult("Deleted");
        }

        public async Task<ServiceResult> DeletePermissions(string permissionId, ApplicationDbContext db)
        {
            var permission = await db.ModulePermissions.SingleOrDefaultAsync(a => a.Id == permissionId);
            if (permission == null)
            {
                return new ServiceResult
                {
                    Errors = new List<string>
                    {
                        $"No Permissions were found with Id=> {permissionId}"
                    }
                };
            }
            db.ModulePermissions.Remove(permission);
            await db.SaveChangesAsync();
            return new ServiceResult("Deleted");
        }

        public async Task<ServiceResult> CreatePermissions(ModulePermission permissions, ApplicationDbContext db)
        {
            var id = Guid.NewGuid().ToString();
            await db.ModulePermissions.AddAsync(new ModulePermission
            {
                ModuleOperations = await db.ModulesOperations.SingleOrDefaultAsync(a => a.Id == permissions.OperationId),
                Permissions = permissions.Permissions,
                Description = permissions.Description,
                Id = id
            });

            await db.SaveChangesAsync();
            return new ServiceResult("Saved") { Data = id };
        }

        public async Task<ServiceResult> EditPermissions(ModulePermission permissions, ApplicationDbContext db)
        {
            var permission = await db.ModulePermissions.SingleOrDefaultAsync(a => a.Id == permissions.Id);
            if (permission == null)
                return new ServiceResult
                {
                    Errors = new List<string>
                    {
                        $"No Permission found with Id => {permissions.Id}"
                    }
                };

            permission.Permissions = permissions.Permissions.Trim();
            permission.Description = permissions.Description.Trim();
            await db.SaveChangesAsync();
            return new ServiceResult("Saved") { Data = permission.Id };
        }

        #endregion

        #region Helpers 
        private static async Task MapPermissions(ApplicationDbContext _db, ApplicationUser user,
           List<UserPermissionsMapper> permissions, string permissionId)
        {
            if (!permissions.Where(a => a.Permissions.Id == permissionId).Any())
            {
                permissions.Add(new UserPermissionsMapper
                {
                    Id = Guid.NewGuid().ToString(),
                    AppUser = user,
                    Permissions = await _db.ModulePermissions.SingleOrDefaultAsync(a => a.Id == permissionId)
                });
            }
        }

        private static async Task SetRolePermissions(RolesInputModel model, RoleManager<IdentityRole> _roleManager,
            ApplicationDbContext _db, IdentityRole role)
        {
            var _rolePermission = new List<RolesPermissionMapper>();

            foreach (var (module, operation, permission) in
                from module in model.Modules
                from operation in module.ModuleOperations
                from permission in operation.Permissions.Where(a => a.Checked)
                select (module, operation, permission))
            {
                _rolePermission.Add(new RolesPermissionMapper
                {
                    Id = Guid.NewGuid().ToString(),
                    Permissions = await _db.ModulePermissions.SingleOrDefaultAsync(a => a.Id == permission.Id),
                    Roles = role
                });
                await _roleManager.AddClaimAsync(role, new Claim(CustomClaimTypes.Permission, $"{module.Name}.{operation.Name}.{permission.Permissions}"));
            }

            await _db.RolesPermissionMappers.AddRangeAsync(_rolePermission);
        }

        private static Task GetSetModuleOperations(Modules modules, ApplicationDbContext db)
        {
            foreach (var item in modules.ModuleOperations)
            {
                item.Id = Guid.NewGuid().ToString();
                foreach (var per in item.Permissions)
                {
                    per.Id = Guid.NewGuid().ToString();
                }
            }

            return db.ModulesOperations.AddRangeAsync(modules.ModuleOperations);
        }

        private static string GenerateRefreshTokenString()
        {
            var randomNumber = new byte[32];
            using var randomNumberGenerator = RandomNumberGenerator.Create();
            randomNumberGenerator.GetBytes(randomNumber);
            return Convert.ToBase64String(randomNumber);
        }

        private async Task<IList<Claim>> GetRoleClaims(IList<string> roles,
            RoleManager<IdentityRole> _roleManager)
        {
            IList<Claim> _roleClaims = new List<Claim>();
            foreach (var item in roles)
            {
                var res = await _roleManager.GetClaimsAsync(await _roleManager.FindByNameAsync(item)).ConfigureAwait(false);
                foreach (var cl in res)
                {
                    _roleClaims.Add(cl);
                }
            }
            return _roleClaims;
        }

        private async Task<ServiceResult> SendOTP(LoginInputModel smsOptions)
        {
            var client = new RestClient(_smsSettings.Url);
            client.AddDefaultHeader("Content-Type", "application/x-www-form-urlencoded");
            client.AddDefaultParameter("user", _smsSettings.User);
            client.AddDefaultParameter("key", _smsSettings.Key);
            client.AddDefaultParameter("mobile", smsOptions.PhoneNumber);
            client.AddDefaultParameter("message", "Login OTP for UserManagement: " + smsOptions.OTP);
            client.AddDefaultParameter("senderid", _smsSettings.SenderId);
            client.AddDefaultParameter("accusage", "1");
            try
            {
                var request = new RestRequest(Method.POST);
                IRestResponse _response = await client.ExecuteAsync(request);
                if (!_response.IsSuccessful)
                {
                    _logger.Log(LogLevel.Error, "SMS Sending Failed");
                }
                smsOptions.TimeGenerated = DateTime.Now;
                return new ServiceResult($"OTP sent to => {smsOptions.PhoneNumber}")
                {
                    Extras = new
                    {
                        _session =
                        Encrypter.EncryptString(JsonConvert.SerializeObject(smsOptions))
                    }
                };
            }
            catch (Exception ex)
            {
                _logger.Log(LogLevel.Error, $"SMS Sending Failed. Error => {ex.Message}");
                var _error = new List<string>()
                {
                    ex.Message
                };
                return new ServiceResult(ex.Message)
                {
                    Errors = _error
                };
            }
        }

        #endregion
    }
}
