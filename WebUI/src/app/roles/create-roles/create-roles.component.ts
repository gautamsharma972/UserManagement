import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NotifierService } from 'angular-notifier';
import swal from 'sweetalert'; 
import { AppComponent } from '../../app.component';
import { ApiService } from '../../services/api.service';
declare var $:any;

@Component({
  selector: 'app-create-roles',
  templateUrl: './create-roles.component.html',
  styleUrls: ['./create-roles.component.css']
})
export class CreateRolesComponent implements OnInit {

  loading: boolean = false;
  isSaveLoading: boolean = false;
  error: any = [];
  roleInput: any = {};
  modules: any = [];
  showRoleChildDiv: boolean;
  toggleClass: any;
  userPermissions: any = [];
  keyword: any = "permissions";
  permissions: any = [];

  constructor(private _apiService: ApiService,
    private _router: Router,
    private _notifier: NotifierService,
    private _appComponent: AppComponent) { }

  ngOnInit() { 
    this.getModules();
    this.userPermissions = this._appComponent.permissions;
  }

  onModulesChecked(event, module) {
    var check = event.target.checked;
    module.checked = check;
    module.moduleOperations.forEach(function (modOp) {
      modOp.checked = check;
      modOp.permissions.forEach(function (per) {
        per.checked = check;
      });
    }); 
  }

  verifyName(e) {
    var key = e.keyCode;
    if (key >= 48 && key <= 57) {
      e.preventDefault();
    }
  }

  onModuleOperationChecked(event, permission) { 
    var check = event == null ? true : event.target.checked;

    this.modules.forEach(function (mod) {
      mod.moduleOperations.forEach(function (modOp) {
        modOp.permissions.forEach(function (per) {
          if (per.id == permission.id) {
            per.checked = check;
          }
        })
      })
    })

    this.modules.forEach(function (mod) {
      mod.moduleOperations.forEach(function (modOp) {
        if (modOp.permissions.filter(a => a.checked).length > 0) {
          mod.checked = true;
        }
      });
    }) 
  }

  getModules() {
    let $this = this;
    this._apiService.getModules().subscribe((res: any) => { 
      if (res.isSuccessful) {
        res.data.forEach(function (mod) {
          mod.checked = false;
          mod.moduleOperations.forEach(function (modOp) {
            modOp.modules = mod;
            modOp.checked = false;
            modOp.permissions.forEach(function (per) {
              if ($this.permissions.filter(a => a.id == per.id).length <= 0) {
                $this.permissions.push(per);
              }
              per.moduleOperations = modOp;
              per.checked = false;
            })
          })
        })
        this.modules = res.data;
      } 
    })
  }

  selectEvent(item) {
    this.onModuleOperationChecked(null, item);
    $('.collapse').removeClass("show");
    $(`#collapse_${item.moduleOperations.modules.id}`).addClass("show");

    $(`#permission_${item.id}`).addClass('divHighlight');
    setTimeout(function () {
      $(`#permission_${item.id}`).removeClass('divHighlight');
    }, 700); 
  }

  onChangeSearch(search: string) {
    // fetch remote data from here
    // And reassign the 'data' which is binded to 'data' property.
  }

  onFocused(e) {
    //
  }

  async create() {
    this.error = [];
    if (this.roleInput.name == undefined ||
      this.roleInput.name == null) {
      this.error.push("Please provide a Role Name");
      $('#roleInput').focus();
      return false;
    }

    this.roleInput.modules = [];
    this.roleInput.modules = this.modules;

    this.modules.forEach(function (mod) {
      mod.moduleOperations.forEach(function (modOp) {
        delete modOp.modules;
        modOp.permissions.forEach(function (per) {
          delete per.moduleOperations;
        })
      })
    })
     
    swal({
      title: 'Are you sure?',
      text: "New Role will be created with the permissions you've selected",
      icon: 'warning',
      buttons: ['Cancel', 'Yes']
    }).then((result) => {
      if (result) {
        this.isSaveLoading = true;
        this._apiService.createRole(this.roleInput).subscribe((res: any) => {
          this.isSaveLoading = false;
          if (res.isSuccessful) {
            this._router.navigate(['/roles']);
            this._notifier.notify('success', `Role ${this.roleInput.name} created successfully.`);
          }
          else {
            this.error = [];
            this.error = res.errors;
          }
        }, err => {
          this.isSaveLoading = false;
          this.error.push("Some error occurred. Please try again");
        })
      }
    })
  }

}
