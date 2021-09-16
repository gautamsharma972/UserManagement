import { Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NotifierService } from 'angular-notifier';
import swal from 'sweetalert'; 
import { AppComponent } from '../../app.component';
import { ApiService } from '../../services/api.service';
declare var $: any;

@Component({
  selector: 'app-create-user',
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.css']
})
export class CreateUserComponent implements OnInit {

  toggleClass: any;
  loading: boolean = false;
  roles: any = [];
  error: any = [];
  user: any = {};
  permissions: any = [];
  userTypes: any = [];
  bankBranches: any = [];
  showBankBranches: boolean = false;
  saveLoading: boolean = false;
  selectedRole: any = [];
  isSaveLoading: boolean = false;
  showRoleChildDiv: boolean = true;
  modules: any = [];
  keyword: any = "permissions";
  hasEmailError: boolean = false;
  userPermissions: any = [];

  constructor(
    private _apiService: ApiService,
    private _router: Router,
    private _notifier: NotifierService,
    private _appComponent: AppComponent
  ) { }

  async ngOnInit() { 
    this.user.userType = "-1";
    this.user.loginType = "2";
    this.getRoles();
    this.getUserTypes(); 
    this.userPermissions = this._appComponent.permissions;
  }

  getUserTypes() {
    this.loading = true;
    this._apiService.getUserTypes().subscribe((res: any) => {
      this.loading = false;
      if (res.isSuccessful) {
        this.userTypes = res.data;
      }
    })
  }

  
  onRoleCheckedAll(event) {
    let check = false;
    if (event.target.checked) {
      check = true;
    }
    this.roles.forEach(function (role) {
      role.checked = check;
    })

    this.modules.forEach(function (mod) {
      mod.checked = check;
      mod.moduleOperations.forEach(function (modOp) {
        modOp.checked = check;
        modOp.permissions.forEach(function (per) {
          per.checked = check;
        })
      })
    })
  }

  getRoles() {
    let $this = this;
    this.loading = true;
    this._apiService.getRoles().subscribe((res: any) => {
      this.loading = false;
      if (res.isSuccessful) {
        res.data.forEach(function (dbRole) {
          dbRole.result.roles.permissions = dbRole.result.permissions;
          dbRole.result.roles.permissions.forEach(function (per) {
            per.role = dbRole
          });
          $this.roles.push(dbRole.result.roles);
        });
        this.getModules();
      }
      else {
        this.error.push(res.data.errors)
      }
    }, error => {
      this.loading = false;
    });
  }

  getModules() {
    let $this = this;
    this._apiService.getModules().subscribe((res: any) => {
      if (res.isSuccessful) {

        this.roles.forEach(function (role) {
          role.checked = false;
          var permissionsLabels = [];
          role.permissions.forEach(function (per) {
  
            if (permissionsLabels.filter(a => a == per.moduleOperations.modules.name).length <= 0) {
              permissionsLabels.push(per.moduleOperations.modules.name);
            }
            res.data.forEach(function (mod) {
              mod.moduleOperations.forEach(function (modOp) {
                modOp.permissions.forEach(function (mper) {

                  if ($this.permissions.filter(a => a.id == per.id).length <= 0) {
                    $this.permissions.push(mper);
                  }

                  mper.moduleOperations = modOp;
                  mper.moduleOperations.modules = mod;
                  if (mper.id == per.id) {
                    mper.moduleOperations.modules.role = role;
                  }

                })
              });
            })

          })
          role.permissionLabel = permissionsLabels.join(", ");
        });
        this.modules = res.data;
      }
    })
  }

  onRoleCheckboxChange(role, event) {
    let $this = this;
    var check = event.target.checked;
    role.checked = check;

    role.permissions.forEach(function (per) {
      per.checked = check;
      per.moduleOperations.checked = check;
      per.moduleOperations.modules.checked = check;

      $this.modules.forEach(function (mod) {
        if (mod.id == per.moduleOperations.modules.id) {
          mod.checked = check;
          mod.moduleOperations.forEach(function (modOp) {
            if (modOp.id == per.moduleOperations.id) {
              modOp.checked = check;
              modOp.permissions.forEach(function (mPer) {
                if (mPer.id == per.id) {
                  mPer.checked = check;
                }
              })
            }
          })
        }
      })
    })

  }

  onBankBranchesCheckedAll(event) {
    var check = event.target.checked;
    let $this = this;
    this.user.bankBranches = [];
    this.bankBranches.forEach(function (res) {
      $this.user.bankBranches.push(res);
      res.checked = check;
    });
  }

  onModuleOperationChecked(event, permission) {
    var check = event == null ? true : event.target.checked;

    this.modules.forEach(function (mod) {
      mod.moduleOperations.forEach(function (modOp) {
        modOp.permissions.forEach(function (per) {
          if (per.id == permission.id) {
            per.checked = check;
            per.moduleOperations.modules.checked = check;
          }
        })
      })
      mod.moduleOperations.filter(a => a.checked).length > 0 ? mod.checked = true : false;
    })

    this.roles.forEach(function (role) {
      role.permissions.forEach(function (per) {
        if (per.id == permission.id) {
          per.checked = check;
        }
      })
    })
  }

  onModulesChecked(module, event) {
    var check = event.target.checked;

    module.moduleOperations.forEach(function (modOp) {
      modOp.checked = check;
      modOp.permissions.forEach(function (per) {
        per.checked = check;
      })
    })


    this.roles.forEach(function (role) {
      role.permissions.forEach(function (per) {
        if (per.moduleOperations.modules.id == module.id) {
          per.checked = check;
          per.moduleOperations.modules.checked = check;
        }
      })
    })

  }

  onBankBranchChecked(bankBranch, event) {
    var check = event.target.checked;
    if (this.user.bankBranches == undefined) {
      this.user.bankBranches = [];
      bankBranch.checked = check;
      this.user.bankBranches.push(bankBranch);
    }
    else {
      this.user.bankBranches.forEach(function (br) {
        if (br.id == bankBranch.id) {
          br.checked = check;
        }
      })
    }

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

  validateEmail(mail) {
    if (this.user.phoneNumber == undefined ||
      this.user.phoneNumber.trim() == "") {
      if (/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(mail)) {
        this.hasEmailError = false;
        return (true)
      }
      this.hasEmailError = true;
      return (false)
    }
    this.hasEmailError = false;
    return true;
  }

  async create() {
    this.error = [];
    if (this.user.firstName == undefined) {
      this.error.push("First Name cannot be blank.");
      $('#fName').focus();
      return false;
    }
    if (this.user.lastName == undefined) {
      this.error.push("LastName cannot be blank.");
      $('#lName').focus();
      return false;
    } 

    if ((this.user.email == undefined || this.user.email == "") &&
      (this.user.phoneNumber != undefined && this.user.phoneNumber.replace(" ", "") != "")) {
      var phone_pattern = /([0-9]{10})|(\([0-9]{3}\)\s+[0-9]{3}\-[0-9]{4})/;
      if (!phone_pattern.test(this.user.phoneNumber)) {
        this.error.push("Please enter a valid Phone Number!");
        $('#phNumber').focus();
        return false;
      }
    }


    if ((this.user.phoneNumber == undefined || this.user.phoneNumber == "") &&
      (this.user.email != undefined && this.user.email.replace(" ", "") != "")) {
      if (this.user.password == undefined || this.user.password == "") {
        this.error.push("Please create a Password if Login Type is Password based.");
        $("#txtPassword").focus();
        return false;
      }
      if (!this.validateEmail(this.user.email)) {
        this.hasEmailError = true;
        $("#txtEmail").focus();
        return false;
      }
    }
     
    this.user.roles = this.roles;
    this.user.roles.forEach(function (role) {
      role.permissions.forEach(function (per) {
        delete per.role;
        delete per.moduleOperations.modules.moduleOperations;
      })
    })

    this.modules.forEach(function (mod) {
      mod.moduleOperations.forEach(function (modOp) {
        delete modOp.modules;
        modOp.permissions.forEach(function (per) {
          delete per.moduleOperations;
        })
      })
    })

    this.user.modules = this.modules;

    swal({
      title: 'Are you sure?',
      text: 'New user will be created with the rights you have selected.',
      icon: 'warning',
      buttons: ['Cancel', 'Yes']
    }).then((result) => {
      if (result) {
        this.isSaveLoading = true;
        this._apiService.createUser(this.user).subscribe((res: any) => {
          this.isSaveLoading = false;
          if (res.isSuccessful) {
            this._router.navigate(['/users']);
            this._notifier.notify('success', `User ${this.user.firstName} ${this.user.lastName} created successfully.`);
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
