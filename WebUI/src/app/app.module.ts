import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core'; 
import { AppComponent } from './app.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { NavSidebarComponent } from './nav-sidebar/nav-sidebar.component';
import { FooterComponent } from './footer/footer.component';
import { HeaderComponent } from './header/header.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ApiService } from './services/api.service';
import { AuthenticationService } from './services/authentication.service';
import { AuthGuard } from './helpers/auth.guard';
import { PermissionService } from './services/permission.service';
import { DatePipe } from '@angular/common';
import { JwtInterceptor } from './helpers/jwt.interceptor';
import { ErrorInterceptor } from './services/error-interceptor.service';
import { RouterModule } from '@angular/router';
import { AppRoutingModule } from './app-routing.module';
import { AuthRoutingModule } from './Auth/auth-routing.module';
import { LoginComponent } from './Auth/login/login.component';
import { CreateUserComponent } from './users/create-user/create-user.component';
import { EditUserComponent } from './users/edit-user/edit-user.component';
import { UsersComponent } from './users/users.component';
import { UsersListComponent } from './components/users-list/users-list.component';
import { RolesListComponent } from './components/roles-list/roles-list.component';
import { NotifierModule, NotifierOptions } from 'angular-notifier';
import { PasswordStrengthMeterModule } from 'angular-password-strength-meter';
import { AutocompleteLibModule } from 'angular-ng-autocomplete';
import { NgxPaginationModule } from 'ngx-pagination';
import { Ng2SearchPipeModule } from 'ng2-search-filter';
import { RolesComponent } from './roles/roles.component';
import { CreateRolesComponent } from './roles/create-roles/create-roles.component';
import { EditRolesComponent } from './roles/edit-roles/edit-roles.component';
import { ModulesComponent } from './modules/modules.component';
import { DisableDirective } from './services/disable-directive';
  
const customNotifierOptions: NotifierOptions = {
  position: {
    horizontal: {
      position: 'right',
      distance: 12
    },
    vertical: {
      position: 'bottom',
      distance: 12,
      gap: 10
    }
  },
  theme: 'material',
  behaviour: {
    autoHide: 5000,
    onClick: 'hide',
    onMouseover: 'pauseAutoHide',
    showDismissButton: true,
    stacking: 4
  },
  animations: {
    enabled: true,
    show: {
      preset: 'slide',
      speed: 300,
      easing: 'ease'
    },
    hide: {
      preset: 'fade',
      speed: 300,
      easing: 'ease',
      offset: 50
    },
    shift: {
      speed: 300,
      easing: 'ease'
    },
    overlap: 150
  }
};


@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    NavSidebarComponent,
    FooterComponent,
    HeaderComponent,
    LoginComponent,
    CreateUserComponent,
    EditUserComponent,
    UsersComponent,
    UsersListComponent,
    RolesListComponent,
    RolesComponent,
    CreateRolesComponent,
    EditRolesComponent,
    ModulesComponent,
    DisableDirective
  ],
  imports: [ 
    ReactiveFormsModule,
    FormsModule,
    BrowserModule,
    NgxPaginationModule,
    RouterModule,
    HttpClientModule,
    AuthRoutingModule,
    AutocompleteLibModule,
    AppRoutingModule, 
    PasswordStrengthMeterModule,
    Ng2SearchPipeModule,
    NotifierModule.withConfig(customNotifierOptions)
  ],
  providers: [ApiService, AuthenticationService, AuthGuard, PermissionService, DatePipe,
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
