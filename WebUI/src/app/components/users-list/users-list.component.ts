import { Component, Input, OnInit } from '@angular/core';
import { NotifierService } from 'angular-notifier'; 
import { ApiService } from '../../services/api.service';
import swal from 'sweetalert';
declare var $: any;

@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.css']
})
export class UsersListComponent implements OnInit {

  @Input() users;
  @Input() limitTo;
  @Input() showPagination;
  @Input() permissions;
  @Input() filterSearch;
  @Input() showPageLimit;
  @Input() showUserType;
  @Input() showOperations;
  @Input() roles;
  tempUsers: any = [];
  isAscendingSort: boolean = false;
  usedRoles: any = [];
  page: number;
  showActiveFilterModal: boolean = false;
  rowsCounts: number;
  selectedRoles: any = [];
  selectedActiveStatus: any = [];
  newSelectedRoles: any = {}; // used for updating new roles of user

  constructor(
    private _apiService: ApiService,
    private _notifier: NotifierService) { }

  ngOnInit() {
    this.rowsCounts = this.users.length;
    this.tempUsers = this.users;
    this.getUsedRoles();
  }

  setUpdatedRoles(event, role, user) { 
    this.newSelectedRoles = {
      user: user,
      roles: []
    };
    this.newSelectedRoles.roles = user.userRoles;

    var checked = event.target.checked;

    if (checked) {
      if (this.newSelectedRoles.roles.filter(a => a == role.name).length <= 0) {
        this.newSelectedRoles.roles.push(role.name);
      }
    }
    else {
      if (this.newSelectedRoles.roles.length > 0) {
        this.newSelectedRoles.roles.splice(this.newSelectedRoles.roles.findIndex(a => a == role.name), 1);
      }
    }
  }

  updateRoles() { 
    if (this.newSelectedRoles != null) {
      this._apiService.updateUserRoles(this.newSelectedRoles).subscribe((res: any) => {
        if (res.isSuccessful) {
          this._notifier.notify("success", `User ${this.newSelectedRoles.user.firstName} updated successfully.`)
        }
        else {
          this._notifier.notify("error", "Error while saving details. Please try again later.");
        }
      }, error => {
        this._notifier.notify("error", "Some error occurred. Please try again later.");
      })
    }
    else {
      this._notifier.notify("error", "Some error occurred. Please try again later.");
    }
  }

  getUsedRoles() {
    let roles = [];
    this.users.forEach(function (user) {
      user.userRoles.forEach(function (role) {
        if (roles.filter(a => a == role).length <= 0) {
          roles.push(role);
        }
      })
    });
    this.usedRoles = roles;
  }

  filterRole(event, role) {
    var check = event.target.checked;

    if (this.selectedRoles.filter(a => a == role).length <= 0) {
      this.selectedRoles.push(role);
    }
    else {
      if (!check) {
        this.selectedRoles.splice(this.selectedRoles.findIndex(a => a == role), 1);
      }
    }

    let $this = this;
    var _tempUser = [];
    if (this.selectedRoles.length <= 0) {
      this.users = [] = this.tempUsers;
    }
    else {
      this.tempUsers.forEach(function (user) {
        $this.selectedRoles.forEach(function (sRole) {
          if (user.userRoles.filter(a => a == sRole).length > 0) {
            if (_tempUser.filter(a => a.id == user.id).length <= 0)
              _tempUser.push(user);
          }
        })

      });
      this.users = [] = _tempUser;
    }

  }

  filterActiveStatus(event, value) {
    debugger;
    value = !value;
    var _tempUser = [];
    var check = event.target.checked;
    let $this = this;
    if (this.selectedActiveStatus.filter(a => a == value).length <= 0) {
      this.selectedActiveStatus.push(value);
    }
    else {
      if (!check) {
        this.selectedActiveStatus.splice(this.selectedActiveStatus.indexOf(a => a == value), 1);
      }
    }

    if (this.selectedActiveStatus.length <= 0) {
      this.users = [] = this.tempUsers;
    }
    else {
      _tempUser = [];
      this.tempUsers.forEach(function (user) {
        $this.selectedActiveStatus.forEach(function (sA) {
          if (sA == 0 && !user.isActive) {
            _tempUser.push(user);
          }
          else if (sA == 1 && user.isActive) {
            _tempUser.push(user);
          }
        })
      })

      this.users = [] = _tempUser;
    }

  }

  resetActiveFilter() {
    this.users = [] = this.tempUsers;
    this.selectedActiveStatus = [];
    $('#activeCheck_0').prop("checked", false);
    $('#activeCheck_1').prop("checked", false);
  }

  resetRoleFilter() {
    this.users = [] = this.tempUsers;
    this.selectedRoles = [];
    this.usedRoles.forEach(function (role) {
      $('#roleCheck_' + role).prop("checked", false);
    })
  }

  changeUserStatus(event, user) {
    var check = event.target.checked;
    swal({
      title: "Are you sure to change User's Active Status?",
      icon: 'warning',
      buttons: ['Cancel', 'Yes']
    }).then((result) => {
      if (result) {
        this._apiService.changeUserStatus(user.id).subscribe((res: any) => {
          if (res.isSuccessful) {
            this.users.filter(a => a.id == user.id)[0].isActive = res.data.isActive;
          }
        }, err => {
          // some error
        })
      }
      else { 
        this.users.filter(a => a.id == user.id)[0].isActive = !check;
        $('#checkbox_' + user.id).prop("checked", !check);
      }
    })
  }

  sort(isAscendingSort) {
    if (isAscendingSort)
      this.users.sort((a, b) => a.firstName > b.firstName ? 1 : a.firstName < b.firstName ? -1 : 0)
    else
      this.users.sort((b, a) => a.firstName > b.firstName ? 1 : a.firstName < b.firstName ? -1 : 0)
  }
}

