import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  baseUrl: any = '';

  constructor(private http: HttpClient) {
    this.baseUrl = window["baseUrl"];
  }

  sendOTP(phoneNumber: any) {
    return this.http.get(`${this.baseUrl}/auth/${phoneNumber}`).pipe(map((res: any) => {
      return res;
    }), catchError(error => {
      return this.handleError(error);
    }));
  }

  getUser(userId) {
    return this.http.get(`${this.baseUrl}/user/${userId}`).pipe(map((res: any) => {
      return res;
    }), catchError(error => {
      return this.handleError(error);
    }));
  }

  getRole(role) {
    return this.http.get(`${this.baseUrl}/Auth/Roles/${role}`, role).pipe(map((res: any) => {
      return res;
    }), catchError(error => {
      return this.handleError(error);
    }));
  }

  editRole(role, roleId) {
    return this.http.put(`${this.baseUrl}/Auth/Roles/Edit/${roleId}`, role).pipe(map((res: any) => {
      return res;
    }), catchError(error => {
      return this.handleError(error);
    }));
  }

  changeUserStatus(userId) {
    return this.http.post(`${this.baseUrl}/User/toggleStatus/${userId}`, userId).pipe(map((res: any) => {
      return res;
    }), catchError(error => {
      return this.handleError(error);
    }));
  }

  getAllUsers() {
    return this.http.get(`${this.baseUrl}/user`).pipe(map((res: any) => {
      return res;
    }), catchError(error => {
      return this.handleError(error);
    }));
  }

  updateUser(user, id) {
    return this.http.put(`${this.baseUrl}/auth/users/${id}`, user).pipe(map((res: any) => {
      return res;
    }), catchError(error => {
      return this.handleError(error);
    }));
  }

  createUser(formData) {
    return this.http.post(`${this.baseUrl}/auth/register`, formData).pipe(map((res: any) => {
      return res;
    }), catchError(error => {
      return this.handleError(error);
    }));
  }

  getRoles() {
    return this.http.get(`${this.baseUrl}/auth/roles`).pipe(map((res: any) => {
      return res;
    }), catchError(error => {
      return this.handleError(error);
    }));
  }

  createRole(roleInput) {
    return this.http.post(`${this.baseUrl}/auth/Roles/Create`, roleInput).pipe(map((res: any) => {
      return res;
    }), catchError(error => {
      return this.handleError(error);
    }));
  }

  getModules() {
    return this.http.get(`${this.baseUrl}/auth/modules`).pipe(map((res: any) => {
      return res;
    }), catchError(error => {
      return this.handleError(error);
    }));
  }

  getModule(moduleId) {
    return this.http.get(`${this.baseUrl}/auth/modules/${moduleId}`, moduleId).pipe(map((res: any) => {
      return res;
    }), catchError(error => {
      return this.handleError(error);
    }));
  }

  logOut(phoneNumber) {
    return this.http.post(`${this.baseUrl}/auth/Logout/${phoneNumber}`, { phoneNumber: phoneNumber }).pipe(map((res: any) => {
      return res;
    }), catchError(error => {
      return this.handleError(error);
    }));
  }

  createModules(modules: any) {
    return this.http.post(`${this.baseUrl}/auth/Modules`, modules).pipe(map((res: any) => {
      return res;
    }), catchError(error => {
      return this.handleError(error);
    }));
  }

  editModules(moduleId: any, modules: any) {
    return this.http.put(`${this.baseUrl}/auth/Modules/${moduleId}`, modules).pipe(map((res: any) => {
      return res;
    }), catchError(error => {
      return this.handleError(error);
    }));
  }

  deleteModule(moduleId: any) {
    return this.http.delete(`${this.baseUrl}/auth/Modules/${moduleId}`, moduleId).pipe(map((res: any) => {
      return res;
    }), catchError(error => {
      return this.handleError(error);
    }));
  }

  getUsersByRole(role: any) {
    return this.http.get(`${this.baseUrl}/auth/users/` + role, role).pipe(map((res: any) => {
      return res;
    }), catchError(error => {
      return this.handleError(error);
    }));
  }

  getoperations() {
    return this.http.get(`${this.baseUrl}/auth/Operations`).pipe(map((res: any) => {
      return res;
    }), catchError(error => {
      return this.handleError(error);
    }));
  }

  addOperation(operation) {
    return this.http.post(`${this.baseUrl}/auth/Operations/Create`, operation).pipe(map((res: any) => {
      return res;
    }), catchError(error => {
      return this.handleError(error);
    }));
  }

  addPermissions(permission) {
    return this.http.post(`${this.baseUrl}/auth/Permissions/Create`, permission).pipe(map((res: any) => {
      return res;
    }), catchError(error => {
      return this.handleError(error);
    }));
  }

  editPermissions(permission) {
    return this.http.put(`${this.baseUrl}/auth/Permissions/Edit/${permission.id}`, permission).pipe(map((res: any) => {
      return res;
    }), catchError(error => {
      return this.handleError(error);
    }));
  }

  deletePermission(permission) {
    return this.http.delete(`${this.baseUrl}/auth/Permissions/delete/${permission.id}`, permission.id).pipe(map((res: any) => {
      return res;
    }), catchError(error => {
      return this.handleError(error);
    }));
  }

  editOperation(operation) {
    return this.http.put(`${this.baseUrl}/auth/Operations/edit/${operation.id}`, operation).pipe(map((res: any) => {
      return res;
    }), catchError(error => {
      return this.handleError(error);
    }));
  }

  deleteOperation(operationId) {
    return this.http.delete(`${this.baseUrl}/auth/Operations/delete/${operationId}`, operationId).pipe(map((res: any) => {
      return res;
    }), catchError(error => {
      return this.handleError(error);
    }));
  }

  getUserTypes() {
    return this.http.get(`${this.baseUrl}/auth/userTypes`).pipe(map((res: any) => {
      return res;
    }), catchError(error => {
      return this.handleError(error);
    }))
  }

  getRecentActions() {
    return this.http.get(`${this.baseUrl}/auth/recentActions`).pipe(map((res: any) => {
      return res;
    }), catchError(error => {
      return this.handleError(error);
    }))
  }

  updateUserRoles(user) {
    return this.http.post(`${this.baseUrl}/auth/updateUserRoles`, user).pipe(map((res: any) => {
      return res;
    }), catchError(error => {
      return this.handleError(error);
    }))
  }

  handleError(error: any): any {
    console.log(error);
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      console.log('An error occurred:', error.error.message);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong.

      console.log(
        `Backend returned code ${error.status}, ` +
        `body was: ${error.error}`);
    }
    // Return an observable with a user-facing error message.
    return throwError(
      'Something bad happened; please try again later.');
  }
}
