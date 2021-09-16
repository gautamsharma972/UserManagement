import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router'; 
import { AppComponent } from '../app.component';
import { ApiService } from '../services/api.service';
declare var $: any;

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {

  roles: any = [];
  currentPage: number = 1;
  itemsPerPage: number = 10;
  loggedUser: any = {};
  users: any = [];
  loading: boolean = false;
  activeUsersCount: number;
  filterSearch: any;
  showActiveFilterModal: boolean = false;
  usersCount: number;
  permissions: any = [];
  tempUsers: any = [];

  constructor(
    private router: Router,
    private http: HttpClient,
    private apiService: ApiService,
    private appComponent: AppComponent,
  ) {

    this.loggedUser = this.appComponent.currentUser;
  }

  ngOnInit() { 
    this.getUsers();
    this.permissions = this.appComponent.permissions;
    this.getRoles();
  }

  async getRoles() {
    let $this = this;
    this.loading = true;
    this.apiService.getRoles().subscribe((res: any) => {
      this.loading = false;
      if (res.isSuccessful) {
        res.data.forEach(function (dbRole) {
          $this.roles.push(dbRole.result.roles);
        });

      }
    }, error => {
      this.loading = false;
    });
  }

  getUsers() {
    this.loading = true;
    this.apiService.getAllUsers().subscribe((res: any) => {
      this.loading = false; 
      if (res != null) {
        this.users = res;
        this.tempUsers = res;
        this.usersCount = this.users.length;
        this.activeUsersCount = res.filter(a => a.isActive).length;
      }
    });
  }


}
