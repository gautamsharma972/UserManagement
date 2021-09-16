import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators'; 
declare var $: any;

@Injectable({ providedIn: 'root' })
export class AuthenticationService {

  private currentUserSubject: BehaviorSubject<object>;
  public currentUser: any;
  baseUrl: any = "";

  constructor(private http: HttpClient) {
    this.currentUserSubject =
      new BehaviorSubject<object>(JSON.parse(sessionStorage.getItem('_currentUser')));
    this.currentUser = this.currentUserSubject.asObservable();
    this.baseUrl = window["baseUrl"];
  }

  public get currentUserValue(): any {
    return this.currentUserSubject.value;
  }

  login(loginModel: any) {
    let _httpHeaders = new HttpHeaders({
      "_session": sessionStorage.getItem("_AuthStore")
    });
    if (loginModel.isPasswordLogin) {
      _httpHeaders = null
    }
    return this.http.post<any>(`${this.baseUrl}/auth/verify`, loginModel, {
      headers: _httpHeaders, withCredentials: loginModel.isPasswordLogin ? false : true
    })
      .pipe(map((user: any) => {
        if (!user.result.error) {
          sessionStorage.clear();
          // store user details and jwt token in local storage to keep user logged in between page refreshes
          sessionStorage.setItem('_currentUser',
            JSON.stringify(user.result));
          this.currentUserSubject.next(user);

          return user;
        }
        else {
          this.currentUser = null;
          return user;
        }
      }));
  }

  logout() { 
    sessionStorage.removeItem('_currentUser');
    sessionStorage.clear();
    this.currentUserSubject.next(null); 
  }
}
