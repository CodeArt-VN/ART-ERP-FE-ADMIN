import { map } from 'rxjs/operators';

import { Component, ChangeDetectorRef } from '@angular/core';
import { NavController, ModalController, LoadingController, AlertController } from '@ionic/angular';
import { PageBase } from 'src/app/page-base';
import { ActivatedRoute } from '@angular/router';
import { EnvService } from 'src/app/services/core/env.service';
import {
  BRA_BranchProvider,
  CRM_ContactProvider,
  SYS_RoleProvider,
} from 'src/app/services/static/services.service';
import { FormArray, FormBuilder, FormControl, Validators } from '@angular/forms';
import { CommonService } from 'src/app/services/core/common.service';


@Component({
  selector: 'app-account-group-detail',
  templateUrl: './account-group-detail.page.html',
  styleUrls: ['./account-group-detail.page.scss'],
})
export class AccountGroupDetailPage extends PageBase {
  statusList: [];
  SelectedOrderList: any;
  SelectedInvoiceList: any;
  constructor(
    public pageProvider: SYS_RoleProvider,
    public branchProvider: BRA_BranchProvider,
    public env: EnvService,
    public navCtrl: NavController,
    public route: ActivatedRoute,
    public modalController: ModalController,
    public contactProvider: CRM_ContactProvider,
    public alertCtrl: AlertController,
    public formBuilder: FormBuilder,
    public cdr: ChangeDetectorRef,
    public loadingController: LoadingController,
    public commonService: CommonService,
  ) {
    super();
    this.pageConfig.isDetailPage = true;
    this.formGroup = formBuilder.group({
      IDBranch: [this.env.selectedBranch],
      Id: new FormControl({ value: '', disabled: true }),
      Name: [''],
      Code: [''],
      Type: [''],
      Remark: [''],
      TitlePosition: this.formBuilder.array([]),
      UserAccount: this.formBuilder.array([]),
      IsDisabled: new FormControl({ value: '', disabled: true }),
      IsDeleted: new FormControl({ value: '', disabled: true }),
      CreatedBy: new FormControl({ value: '', disabled: true }),
      CreatedDate: new FormControl({ value: '', disabled: true }),
      ModifiedBy: new FormControl({ value: '', disabled: false }),
      ModifiedDate: new FormControl({ value: '', disabled: false }),
      DeletedFields: [[]],
    });
  }




  typeDataSource: any;
  preLoadData(event?: any): void {
    this.typeDataSource = this.env.branchList.filter((d) => d.Type == "PositionType");
    super.preLoadData(event);
  }


  loadedData(event?: any, ignoredFromGroup?: boolean): void {
    super.loadedData(event, ignoredFromGroup);
    this.patchTitlePositionValue();
    this.patchUserAccountValue();
  }


  private patchTitlePositionValue() {
    this.formGroup.controls.TitlePosition = new FormArray([]);
    if (this.item.TitlePositions?.length) {
      this.item.TitlePositions.forEach(i => {
        this.addTitlePositionValue(i);
      });
    }
  }

  private addTitlePositionValue(line, markAsDirty = false) {
    let groups = <FormArray>this.formGroup.controls.TitlePosition;
    let group = this.formBuilder.group({
      Id: [line.Id],
      Name: [line.Name, Validators.required],
      Remark: [line.Remark],
    });
    groups.push(group);
    if (markAsDirty) {
      group.get('Name').markAsDirty();
      group.get('Remark').markAsDirty();
     
    }
  }

  private patchUserAccountValue() {
    this.formGroup.controls.UserAccount = new FormArray([]);
    if (this.item.UserAccount?.length) {
      this.item.UserAccount.forEach(i => {
        this.addUserAccountValue(i);
      });
    }
  }
  

  private addUserAccountValue(line, markAsDirty = false) {
    let groups = <FormArray>this.formGroup.controls.UserAccount;
    let group = this.formBuilder.group({
      Id: [line.Id],
      Name: [line.Name, Validators.required],
      Remark: [line.Remark],
    });
    groups.push(group);
    if (markAsDirty) {
      group.get('Name').markAsDirty();
      group.get('Remark').markAsDirty();
      group.get('Sort').markAsDirty();
    }
  }
  
  isOpenTitlePosition = true;
  changeType(e) {
    console.log(e);
  }
 

  addTitlePosition(){
    let newTitlePosition = {
      Id: 0,
      Name: '',
      Remark:''
    };
    this.addTitlePositionValue(newTitlePosition, true);
  }
}
