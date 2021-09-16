import { Component, OnInit } from '@angular/core'; 
import { AppComponent } from '../app.component';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-roles',
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.css']
})
export class RolesComponent implements OnInit {

  loading: boolean;
  roles: any[];
  error: any;
  permissions: any;
  filterRoleSearch: any;

  constructor(private _apiService: ApiService,
    private _appComponent: AppComponent
  ) { }

  ngOnInit() { 
    this.getRoles();
    this.permissions = this._appComponent.permissions;
  }

  async getRoles() {
    let $this = this;
    this.loading = true;
    this.roles = [];
    this._apiService.getRoles().subscribe((res: any) => {
      this.loading = false;
      if (res.isSuccessful) {

        res.data.forEach(function (dbRes) {
          dbRes.result.roles.permissions = dbRes.result.permissions;
          dbRes.result.roles.usersCount = dbRes.result.usersCount;
          $this.roles.push(dbRes.result.roles);
        });
        this.roles.forEach(function (role) {
          role.checked = false;
          var permissionsLabels = [];
          role.permissions.forEach(function (per) {
            if (permissionsLabels.filter(a => a == per.moduleOperations.modules.name).length <= 0) {
              permissionsLabels.push(per.moduleOperations.modules.name);
            }
          })
          role.permissionLabel = permissionsLabels.join(", ");
        });
      }
       
    }, error => {
      this.loading = false;
    });
  }
}
