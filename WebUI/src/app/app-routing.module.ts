import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router'; 
import { DashboardComponent } from './dashboard/dashboard.component';
import { AuthGuard } from './helpers/auth.guard';  
import { ModulesComponent } from './modules/modules.component';
import { CreateRolesComponent } from './roles/create-roles/create-roles.component';
import { EditRolesComponent } from './roles/edit-roles/edit-roles.component';
import { RolesComponent } from './roles/roles.component';
import { CreateUserComponent } from './users/create-user/create-user.component';
import { EditUserComponent } from './users/edit-user/edit-user.component';
import { UsersComponent } from './users/users.component';

const routes: Routes = [
  {
    path: '', component: DashboardComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'users', component: UsersComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'users/create', component: CreateUserComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'users/edit/:userId', component: EditUserComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'roles', component: RolesComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'roles/create', component: CreateRolesComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'roles/edit/:roleId', component: EditRolesComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'modules', component: ModulesComponent,
    //canActivate: [AuthGuard],
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})

export class AppRoutingModule { }
