import { Component, OnInit } from '@angular/core';
import { AppComponent } from '../app.component';
import { ApiService } from '../services/api.service';
import { PermissionService } from '../services/permission.service';
declare var $: any;

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  constructor(
    private apiService: ApiService,
    private appComponent: AppComponent
  ) {
    this.loggedUser = this.appComponent.currentUser;
  }

  loggedUser: any = {};
  loading: boolean = false;
  activeUsersCount: number;
  filterSearch: any;
  usersCount: number;
  permissions: any = [];
  rolesCount: number;
  bankUsersCount: number;
  recentActionLoading: boolean = false;
  recentActions: any = [];

  ngOnInit() { 
    this.getUsers();
    this.getRoles();
    this.permissions = this.appComponent.permissions;
  }

  getUsers() {
    this.loading = true;
    this.apiService.getAllUsers().subscribe((res: any) => {
      this.loading = false;
      if (res != null) {
        this.usersCount = res.length;
        this.activeUsersCount = res.filter(a => a.isActive).length;
        this.bankUsersCount = res.filter(a => a.userTypes != undefined && a.userTypes.id == 2).length;
      }
    });
  }

  getRoles() {
    this.loading = true;
    this.apiService.getRoles().subscribe((res: any) => {
      this.loading = false;
      if (res.isSuccessful) {
        this.rolesCount = res.data.length;
      }
    }, error => {
      this.loading = false;
    });
  }

}
