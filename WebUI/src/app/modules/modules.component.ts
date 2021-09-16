import { Component, OnInit } from '@angular/core';
import swal from 'sweetalert';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { NotifierService } from 'angular-notifier';
declare var $: any;

@Component({
  selector: 'app-modules',
  templateUrl: './modules.component.html',
  styleUrls: ['./modules.component.css']
})
export class ModulesComponent implements OnInit {

  modules: any = {};
  error: any = [];
  isSaveLoading: boolean;
  loading: any = false;
  isModuleEdit: boolean = false;
  modulesList: any = [];
  isOperationLoading: boolean = false;
  operations: any = [];
  operationModel: any = {};
  isOperationEdit: boolean = false;
  permissionModel: any = {};
  permissionsOperations: any = [];
  permissionSelected: any = [];
  showPermissions: boolean = false;
  permissionEdit: boolean = false;

  constructor(private apiService: ApiService,
    private _notifierService: NotifierService) { }

  ngOnInit() {
    this.modules.name = "";
    this.modules.moduleOperations = [];
    this.operationModel.moduleId = "-1";
    this.permissionModel.moduleId = "-1";
    this.permissionModel.operationId = "-1";
    this.getModules();
    this.getOperations();

  }

  verifyName(e) {
    var key = e.keyCode;
    if (key >= 48 && key <= 57) {
      e.preventDefault();
    }
  }

  getModuleOperations(event) {

    if ($('#selectModule').hasClass('border-danger')) {
      $('#selectModule').removeClass('border-danger');
    }

    this.permissionsOperations = [];
    var operations = this.modulesList.filter(a => a.id == event.target.value);
    if (operations[0].moduleOperations != null && operations[0].moduleOperations.length > 0) {
      operations[0].moduleOperations.forEach(function (op) {
        op.moduleId = event.target.value;
      })
      this.permissionsOperations = operations[0].moduleOperations;
    }

    this.getSetPermissions();
  }

  cancelModuleEdit() {
    this.isModuleEdit = false;
    $("#txtModuleName").val("");
    $("#txtDescriptionModule").val("");
  }

  editPermission(permission) {
    this.permissionEdit = true;
    this.permissionModel.id = permission.id;
    this.permissionModel.permissions = permission.permissions;
    this.permissionModel.description = permission.description;
  }

  filterPermission(operationId) {
    if (this.permissionSelected.length > 0) {
      var permissionSelected = this.permissionSelected.filter(a => a.operationId == operationId);
      if (permissionSelected.length <= 0) {
        let $this = this;
        this.permissionSelected = [];
        this.permissionsOperations.forEach(function (modOp) {
          if (modOp.id == operationId) {
            modOp.permissions.forEach(function (per) {
              per.operationId = modOp.id;
              $this.permissionSelected.push(per);

            });
          }

        });
      }
      else {
        this.permissionSelected = permissionSelected;
      }
    }
    else { 
      let $this = this;
      this.permissionSelected = [];
      this.permissionsOperations.forEach(function (modOp) {
        if (modOp.id == operationId) {
          modOp.permissions.forEach(function (per) {
            per.operationId = modOp.id;
            $this.permissionSelected.push(per);

          });
        }

      });
    }
  }

  private getSetPermissions() {
    let $this = this;
    this.permissionSelected = [];
    this.permissionsOperations.forEach(function (modOp) {
      modOp.permissions.forEach(function (per) {
        if ($this.permissionSelected.filter(a => a.permissions == per.permissions
          && a.operationId == modOp.id).length <= 0) {
          per.operationId = modOp.id;
          $this.permissionSelected.push(per);
        }
      });
    });
  }

  createPermissions() {
    if (this.permissionModel.moduleId == undefined ||
      this.permissionModel.moduleId == null) {
      $('#selectModule').focus();
      $('#selectModule').addClass("border border-danger");
      return false;
    }

    if (this.permissionModel.operationId == undefined ||
      this.permissionModel.operationId == null) {
      $('#selectOperation').focus();
      $('#selectOperation').addClass("border border-danger");
      return false;
    }

    if (this.permissionModel.permissions == undefined ||
      this.permissionModel.permissions == null) {
      $('#txtPermissions').focus();
      $('#txtPermissions').addClass("border border-danger");
      return false;
    }

    if (this.permissionModel.moduleId == "-1") {
      $('#selectModule').focus();
      $('#selectModule').addClass("border border-danger");
      return false;
    }
    if (this.permissionModel.operationId == "-1") {
      $('#selectOperation').focus();
      $('#selectOperation').addClass("border border-danger");
      return false;
    }

    else if (this.permissionModel.permissions.trim() == "") {
      $('#txtPermissions').focus();
      $('#txtPermissions').addClass("border border-danger");
      return false;
    }
    this.isSaveLoading = true;
    if (!this.permissionEdit) {
      this.apiService.addPermissions(this.permissionModel).subscribe((res: any) => {
        this.isSaveLoading = false;
        if (res.isSuccessful) {
          this.permissionSelected.push({
            permissions: this.permissionModel.permissions,
            operationId: this.permissionModel.operationId,
            id: res.data
          });
          this.permissionModel.permissions = "";
          this.permissionModel.description = "";
          this._notifierService.notify("success", "New Permission created");
        }
        else {
          this.permissionModel.permissions = "";
          this.permissionModel.description = "";
          swal({
            title: "Error creating Permission",
            text: `${res.errors.join(",")}`,
            icon: 'error'
          });
        }
      })
    }
    else {
      this.isSaveLoading = true;
      this.apiService.editPermissions(this.permissionModel).subscribe((res: any) => {
        this.isSaveLoading = false;
        if (res.isSuccessful) {
          this.permissionSelected.filter(a => a.id == this.permissionModel.id)[0].permissions = this.permissionModel.permissions;
          this.permissionModel.permissions = "";
          this.permissionModel.description = "";
          this.permissionEdit = false;
          this._notifierService.notify("success", "Permission was updated.");
        }
        else {
          swal({
            title: "Error creating Permission",
            text: `${res.errors.join(",")}`,
            icon: 'error'
          });
        }
      })
    }
  }

  deletePermission(permission) {
    swal({
      title: 'Sure to delete?',
      text: `Permission '${permission.permissions}' will be deleted permanently`,
      icon: 'warning',
      buttons: ['Cancel', 'Yes']
    }).then((result) => {
      if (result) {
        this.apiService.deletePermission(permission).subscribe((res: any) => {

          if (res.isSuccessful) {
            debugger;
            this.permissionSelected.splice(this.permissionSelected.indexOf(a => a.id == permission.id, 1))
            swal({
              icon: 'success',
              title: 'Permission deleted'
            });
          }
          else {
            swal({
              icon: 'warning',
              title: 'Error occurred. Fix the following error and try again',
              text: res.errors.join(", ")
            });
          }

          this.getOperations();
        })

      }
    })

  }

  selectedModuleChanged(event) {
    if (event.target.value.trim() != "") {
      $('#selectOpModule').removeClass("border-danger");
    }
  }

  addOperation() {

    if (this.operationModel.moduleId == undefined ||
      this.operationModel.moduleId == null) {
      $('#selectOpModule').focus();
      $('#selectOpModule').addClass("border border-danger");
      return false;
    }
    else if (this.operationModel.moduleId == "-1") {
      $('#selectOpModule').focus();
      $('#selectOpModule').addClass("border border-danger");
      return false;
    }

    if (this.operationModel.name == undefined ||
      this.operationModel.name == null) {
      $('#txtOperationName').focus();
      return false;
    }
    else if (this.operationModel.name.trim() == "") {
      $('#txtOperationName').focus();
      return false;
    }

    this.isSaveLoading = true;
    if (this.isOperationEdit) {
      this.apiService.editOperation(this.operationModel).subscribe((res: any) => {
        this.isSaveLoading = false;
        if (res.isSuccessful) {
          this._notifierService.notify("success", "Operation was updated successfully");
          this.getOperations();
          this.operationModel = {};
          this.isOperationEdit = false;
          this.getModules();
          
        }
        else {
          swal({
            title: 'Error while saving',
            text: `Some error occurred while updating Operation. Error: ${res.errors.join(",")}.`,
            icon: 'error'
          });
        }
      })
    }
    else {
      this.apiService.addOperation(this.operationModel).subscribe((res: any) => {
        this.isSaveLoading = false;
       
        if (res.isSuccessful) {
          this._notifierService.notify("success", "Operation was created successfully");
          this.operationModel = {};
          this.isOperationEdit = false; 
          this.getOperations();
          this.getModules();
        }
        else {
          swal({
            title: 'Error while saving',
            text: `${res.errors.join(",")}.`,
            icon: 'error'
          });
        }
      })
    }
  }

  deleteOperation(operation) {
    swal({
      title: 'Sure to delete?',
      text: `Operation '${operation.name}' and its permissions will be deleted permanently`,
      icon: 'warning',
      buttons: ['Cancel', 'Yes']
    }).then((result) => {
      if (result) {
        this.apiService.deleteOperation(operation.id).subscribe((res: any) => {
          if (res.isSuccessful) {
            swal({
              icon: 'success',
              title: 'Operation deleted'
            });
            this.getOperations();
          }
          else {
            swal({
              icon: 'warning',
              title: 'Error occurred. Fix the following error and try again',
              text: res.errors.join(", ")
            });
          }
        })
      }
    })
  }

  editOperation(operation) {
    debugger;
    this.isOperationEdit = true;
    this.operationModel.id = operation.id;
    this.operationModel.moduleId = operation.modules.id;
    this.operationModel.name = operation.name;
    this.operationModel.description = operation.description == null ? "" : operation.description;
  }

  editModule(module) {
    this.isModuleEdit = true;
    this.modules.id = module.id;
    this.modules.name = module.name;
    this.modules.description = module.description;
  }

  getOperations() {
    this.isOperationLoading = true;
    this.apiService.getoperations().subscribe((res: any) => {
      this.isOperationLoading = false;
      this.operations = res.data;
    });
  }

  getModules() {
    this.loading = true;
    this.apiService.getModules().subscribe((res: any) => {
      this.loading = false;
      if (res.isSuccessful) {
        res.data.forEach(function (mod) {
          var totalPermissions = 0;
          mod.moduleOperations.forEach(function (modOp) {
            totalPermissions += modOp.permissions.length;
          })
          mod.totalPermissions = totalPermissions;
        });

        this.modulesList = res.data;
      }

    }, error => {
      this.loading = false;
    })
  }

  showModuleTab() {
    if (!$('#modules').hasClass("active")) {
      $('#modules').addClass("active show");
    }
    if (!$('#moduleMenu').hasClass("active")) {
      $('#moduleMenu').addClass("active");
    }

    $('#operationMenu').removeClass("active");
    $("#operations").removeClass("active");
    $('#permissions').removeClass('active');
    $('#permissionsTab').removeClass('active');
  }

  showOperationTab() {
    if (!$('#operations').hasClass("active")) {
      $('#operations').addClass("active show");
    }
    if (!$('#operationMenu').hasClass("active")) {
      $('#operationMenu').addClass("active");
    }

    $('#modules').removeClass("active");
    $("#modulesMenu").removeClass("active");
    $('#permissions').removeClass('active');
    $('#permissionsTab').removeClass('active');
  }

  cancelAddPermission() {
    this.permissionEdit = false;
    this.permissionModel = {};
    this.permissionModel.moduleId = "-1";
    this.permissionModel.operationId = "-1";

  }

  cancelAddOperation() {
    this.isOperationEdit = false;
    this.operationModel = {};
    this.operationModel.moduleId = "-1";
  }

  deleteModule(module) {
    swal({
      title: 'Sure to delete?',
      text: `Module '${module.name}' and its permissions will be deleted permanently`,
      icon: 'warning',
      buttons: ['Cancel', 'Yes']
    }).then((result) => {
      if (result) {
        this.apiService.deleteModule(module.id).subscribe((res: any) => {
          if (res.isSuccessful) {
            swal({
              icon: 'success',
              title: 'Module deleted'
            });
            this.getModules();
          }
          else {
            swal({
              icon: 'warning',
              title: 'Error occurred. Fix the following error and try again',
              text: res.errors.join(", ")
            });
          }
        })
      }
    })
  }

  addModule() {
    if (this.modules.name == undefined ||
      this.modules.name == null) {
      $('#txtModuleName').focus();
      return false;
    }
    else if (this.modules.name.trim() == "") {
      $('#txtModuleName').focus();
      return false;
    }

    this.isSaveLoading = true;
    if (this.modules.name == undefined || this.modules == "") {
      return false;
    }
    if (this.isModuleEdit) {
      this.apiService.editModules(this.modules.id, this.modules).subscribe((res: any) => {
        this.isSaveLoading = false;
        if (res.isSuccessful) {

          this._notifierService.notify('success', `Module ${this.modules.name} updated successfully.`);
          this.getModules();
          this.getOperations();
          this.modules.name = "";
          this.modules.description = "";
          this.modules.moduleOperations = [];
          this.isModuleEdit = false;
        }
        else {
          swal({
            text: res.errors.join(", "),
            icon: 'error',
            title: "Error creating Module"
          });
        }
      })
    }
    else {
      this.apiService.createModules(this.modules).subscribe((res: any) => {
        this.isSaveLoading = false;
        if (res.isSuccessful) {
          this._notifierService.notify('success', `Module ${this.modules.name} created successfully.`);
          this.getModules();
          this.modules.name = "";
          this.isModuleEdit = false;
          this.modules.description = "";
          this.modules.moduleOperations = [];
        }
        else {
          swal({
            text: res.errors.join(", "),
            icon: 'error',
            title: "Error creating Module"
          });
        }
      })
    }

  }
}
