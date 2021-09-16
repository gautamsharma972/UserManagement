import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NotifierService } from 'angular-notifier';
import swal from 'sweetalert';
import { AppComponent } from '../../app.component';
import { ApiService } from '../../services/api.service';
declare var $: any;

@Component({
  selector: 'app-edit-roles',
  templateUrl: './edit-roles.component.html',
  styleUrls: ['./edit-roles.component.css']
})
export class EditRolesComponent implements OnInit {

  loading: boolean = false;
  isSaveLoading: boolean = false;
  error: any = [];
  roleInput: any = {};
  modules: any = [];
  toggleClass: any;
  roleName: any;
  userPermissions: any = [];
  permissions: any = [];
  keyword: any = "permissions";
  showRoleChildDiv: boolean;

  constructor(private _apiService: ApiService,
    private _router: Router,
    private _appComponent: AppComponent,
    private _currentRoute: ActivatedRoute,
    private _notifier: NotifierService) { }

  ngOnInit() {
    this.getRole();
    this.userPermissions = this._appComponent.permissions;
  }

  verifyName(e) {
    var key = e.keyCode;
    if (key >= 48 && key <= 57) {
      e.preventDefault();
    }
  }

  getRole() {
    this.roleName = this._currentRoute.snapshot.params["roleId"] || null;
    if (this.roleName == null) {
      this._router.navigate(['/notFound'])
      return false;
    }
    this._apiService.getRole(this.roleName).subscribe((res: any) => {
      if (res.isSuccessful) {
        this.roleInput = res.data.roles;
        this.roleInput.permissions = res.data.permissions;
        this.getModules();
      }
    })
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

  onModuleOperationChecked(event, permission) {
    var check = event == null ? true : event.target.checked;
    permission.moduleOperations.modules.checked = check;
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
              per.checked = false;
              $this.roleInput.permissions.forEach(function (rolePer) {
                if (rolePer != null) {
                  per.moduleOperations = modOp;
                  if (rolePer.id == per.id) {
                    per.checked = true;
                    per.moduleOperations.checked = true;
                    per.moduleOperations.modules.checked = true;
                  }
                }
                
              })
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
    });

    swal({
      title: 'Are you sure?',
      text: `This will update '${this.roleInput.name}' with new Permissions you've selected`,
      icon: 'warning',
      buttons: ['Cancel', 'Yes']
    }).then((result) => {
      if (result) {
        this.isSaveLoading = true;
        this._apiService.editRole(this.roleInput, this.roleName).subscribe((res: any) => {
          this.isSaveLoading = false;
          if (res.isSuccessful) {
            this._router.navigate(['/roles']);
            this._notifier.notify('success', `Role ${this.roleInput.name} updated successfully.`);
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
