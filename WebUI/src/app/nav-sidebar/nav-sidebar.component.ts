import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppComponent } from '../app.component';
import { ApiService } from '../services/api.service';
import { AuthenticationService } from '../services/authentication.service';
import { PermissionService } from '../services/permission.service';
declare var $: any;
@Component({
  selector: 'app-nav-sidebar',
  templateUrl: './nav-sidebar.component.html',
  styleUrls: ['./nav-sidebar.component.css']
})
export class NavSidebarComponent implements OnInit {

  isCollapsed: boolean = true;
  permissions: any = [];
  user: any = {};
  isLoginPage: boolean = true;
  constructor(
    private router: Router,
    private _appComponent: AppComponent,
    private _apiService: ApiService,
    private _authService: AuthenticationService) {

  }

  ngOnInit() {
    this.router.events
      .subscribe((event: any) => {
        if (event.url != undefined)
          if (event.url.indexOf("login") > 0) {
            this._appComponent.isLoginPage = true;
            this.isLoginPage = true;
          }
          else {
            this.isLoginPage = false;
            this._appComponent.isLoginPage = false;
          }
      });

    var currentUser = sessionStorage.getItem("_currentUser") || null;
    if (currentUser != null) {
      var user = JSON.parse(currentUser);
      this.user = user.user;
      sessionStorage.setItem("userId", this.user.id);
      this.permissions = this._appComponent.permissions;
    }
  }

  toggleMenu() {
    document.querySelector(".sidebar").classList.toggle("open");
    this.menuButtonChange();
  }

  menuButtonChange() {
    let sidebar = document.querySelector(".sidebar");
    let btn = document.querySelector('#btn');
    if (sidebar.classList.contains("open")) {
      btn.classList.replace("bx-menu", "bx-menu-alt-right");
    } else {
      btn.classList.replace("bx-menu-alt-right", "bx-menu");
    }
  }
  setHeader() {
    if (!this.isCollapsed) {
      $('.header-custom').css("margin-left", "250px");
      $('.content-wrapper').css("margin-left", "250px");
      $('.footer-custom').css("margin-left", "250px");
    }
    else {
      $('.header-custom').css("margin-left", "78px");
      $('.content-wrapper').css("margin-left", "78px");
      $('.footer-custom').css("margin-left", "78px");
    }
  }
   
  logout() {
    let $this = this;
    this.router.navigate(['/login']);
    var currentUser = sessionStorage.getItem("_currentUser");
    var user = JSON.parse(currentUser);
    this._apiService.logOut(user.phoneNumber).subscribe((res: any) => {
      $this._authService.logout();
      $this._appComponent.isLoginPage = true;
    })
  }
}
