import { Component, Input, OnInit } from '@angular/core'; 
import { ApiService } from '../../services/api.service';
declare var $: any;
@Component({
  selector: 'app-roles-list',
  templateUrl: './roles-list.component.html',
  styleUrls: ['./roles-list.component.css']
})
export class RolesListComponent implements OnInit {

  @Input() roles;
  @Input() permissions;
  @Input() limitTo;
  @Input() showPagination;
  @Input() filterSearch;
  @Input() showRowCounts;
  @Input() showUsersCount;
  @Input() showOperations;
  @Input() filterRoleSearch;

  showUsers: boolean = false;
  isUsersLoading: boolean = false;
  selectedRole: any = {};
  page: any;
  constructor(private _apiService: ApiService) { }

  ngOnInit() {
  }

  viewUsers(role) {
    this.isUsersLoading = true;
    this.showUsers = true;
    this._apiService.getUsersByRole(role).subscribe((res: any) => {
      this.isUsersLoading = false;
      if (res.isSuccessful) { 
        this.selectedRole = res.data.role;
        this.selectedRole.users = [];
        this.selectedRole.users = res.data.users; 
        $('#modalUsers').fadeIn();
      }
    })
  }

  closeModal() {
    $("#modalUsers").fadeOut();
  }
}
