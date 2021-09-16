import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { PermissionService } from './services/permission.service';
declare var $: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  title = 'User Management';
  currentUser: any = {};
  permissions: any = [];
  isLoginPage: boolean = false;

  constructor(private router: Router,
    private permissionsService: PermissionService) {
  }

  ngOnInit() {
    var user = sessionStorage.getItem("_currentUser") || null;

    if (user != null)
      this.currentUser = JSON.parse(user);
    else
      this.currentUser = null; 
    this.permissions = this.permissionsService.getSetPermissions();
    if ($('.content-wrapper').css("margin-left") == "0") {
      $('.content-wrapper').css("margin-left", "0");
    }
  }
}
