import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppComponent } from '../app.component';
import { ApiService } from '../services/api.service';
import { AuthenticationService } from '../services/authentication.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  user: any = [];
  permissions: any = [];
  isLoginPage: boolean;

  constructor(private router: Router,
    private _appComponent: AppComponent,
    private _apiService: ApiService,
    private _authService: AuthenticationService) { }

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
