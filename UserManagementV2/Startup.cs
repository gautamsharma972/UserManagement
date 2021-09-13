using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System;
using UserManagement.Configurations;
using UserManagement.Core;
using UserManagement.Data;
using UserManagement.Models;

namespace UserManagement
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }
        static readonly string _corsPolicy = "_corsPolicy";
        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.SwaggerConfiguration();
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(
                    Configuration.GetConnectionString("DefaultConnection")));

            services.AddIdentity<ApplicationUser, IdentityRole>(options =>
            {
                options.User.RequireUniqueEmail = true;
            }).AddEntityFrameworkStores<ApplicationDbContext>()
        .AddTokenProvider<DataProtectorTokenProvider<ApplicationUser>>(TokenOptions.DefaultProvider);

            services.CorsConfiguration(Configuration, _corsPolicy);
            services.ConfigureDI(Configuration);

            services.AddDistributedMemoryCache();
            services.AddSession(options =>
            {
                options.Cookie.Name = ".UserManagement.Session";
                options.IdleTimeout = TimeSpan.FromMinutes(3);
                options.Cookie.IsEssential = true;
            });

            services.AddControllers()
               .AddNewtonsoftJson(options => options.
               SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore);

            services.ConfigureApplicationCookie(sessionConfig =>
            {
                sessionConfig.ExpireTimeSpan = TimeSpan.FromHours(24);
                sessionConfig.SlidingExpiration = true;
            });
            //  services.ConfigureAuth(Configuration);


        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            app.UseHttpsRedirection();
            app.UseCors(_corsPolicy);
            app.UseRouting();
            app.UseAuthentication();
            app.UseAuthorization();
            app.UseSession();

            app.UseMiddleware<JwtMiddleware>();
            app.UseSwagger().
                UseSwaggerUI(options =>
            options.SwaggerEndpoint("/swagger/v1/swagger.json", "User Management"));

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
            });
        }
    }
}
