import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {

  permissions: any = [];

  constructor() {
  }

  getSetPermissions() {
    var permissions = JSON.parse(sessionStorage.getItem("_currentUser")) || null;
    if (permissions == null) {
      return [];
    }
    var modules = permissions.user.modulePermissions;
    let $this = this;
    if (this.permissions.length <= 0) {
      modules.forEach(function (mod) {
        if (mod.permissions != null) {
          if ($this.permissions.filter(a => a == mod.permissions.permissions.split(" ").join("")).length <= 0) {
            $this.permissions.push(mod.permissions.permissions.split(" ").join("").toLowerCase());
            if (mod.permissions.moduleOperations != null ||
              mod.permissions.moduleOperations != undefined) {
              $this.permissions.push(mod.permissions.moduleOperations.name.split(" ").join("").toLowerCase())
              $this.permissions.push(mod.permissions.moduleOperations.modules.name.split(" ").join("").toLowerCase());
            }
          }
        }
       

      });
    }
    else {
      this.permissions.forEach(function (res) {
        modules.forEach(function (mod) {
          if (mod.permissions != res) {
            $this.permissions.push(mod.permissions.permissions.split(" ").join("").toLowerCase());
          }
          if (mod.permissions.moduleOperations.name != res) {
            $this.permissions.push(mod.permissions.moduleOperations.name.split(" ").join("").toLowerCase());
          }
          if (mod.permissions.moduleOperations.modules.name == res) {
            $this.permissions.push(mod.permissions.moduleOperations.modules.name.split(" ").join("").toLowerCase());
          }
        });
      });
    }
    return this.permissions;
  }
}
