import { catchError, distinctUntilChanged, map, merge, switchMap, tap } from 'rxjs/operators';
import { from, of, Subject } from 'rxjs';
import { Component, ChangeDetectorRef, ViewChild } from '@angular/core';
import { NavController, ModalController, LoadingController, AlertController } from '@ionic/angular';
import { PageBase } from 'src/app/page-base';
import { ActivatedRoute } from '@angular/router';
import { EnvService } from 'src/app/services/core/env.service';
import {
  BRA_BranchProvider,
  CRM_ContactProvider,
  SYS_AccountGroupProvider,
  SYS_BranchInGroupProvider,
  SYS_UserInGroupProvider,
} from 'src/app/services/static/services.service';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { CommonService } from 'src/app/services/core/common.service';
import { ACCOUNT_ApplicationUserProvider } from 'src/app/services/custom.service';

@Component({
  selector: 'app-account-group-detail',
  templateUrl: './account-group-detail.page.html',
  styleUrls: ['./account-group-detail.page.scss'],
})
export class AccountGroupDetailPage extends PageBase {
  @ViewChild('popoverTitlePosition') popoverTitlePosition;

  roleDataSource: any;
  titlePositions: any;
  formGroupTitle: FormGroup<any>;
  isPopoverTitlePositionOpen = false;
  isOpenTitlePosition = false;
  roleSelected: string;
  constructor(
    public pageProvider: SYS_AccountGroupProvider,
    public branchInGroupProvider: SYS_BranchInGroupProvider,
    public accountUserProvider: ACCOUNT_ApplicationUserProvider,
    public userInGroupProvider: SYS_UserInGroupProvider,
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
      IDBranch: [''],
      Id: new FormControl({ value: '', disabled: true }),
      Name: ['', Validators.required],
      Code: ['', Validators.required],
      Type: ['', Validators.required],
      Remark: [''],
      TitlePosition: this.formBuilder.array([]),
      UserAccount: this.formBuilder.array([]),
      IDUser: [''],
      IsDisabled: new FormControl({ value: '', disabled: true }),
      IsDeleted: new FormControl({ value: '', disabled: true }),
      CreatedBy: new FormControl({ value: '', disabled: true }),
      CreatedDate: new FormControl({ value: '', disabled: true }),
      ModifiedBy: new FormControl({ value: '', disabled: true }),
      ModifiedDate: new FormControl({ value: '', disabled: true }),
    });
  }

  preLoadData(event?: any): void {
    Promise.all([
      this.accountUserProvider.commonService.connect('GET', 'Account/GetRoles', null).toPromise(),
      this.branchProvider.read({
        Take: 5000,
        AllChildren: true,
        AllParent: true,
      }),
    ]).then((values) => {
      this.roleDataSource = values[0];
      let dataTitlePosition = values[1]['data'].filter((i) => i.Type == 'TitlePosition');
      this.buildFlatTree(dataTitlePosition, this.titlePositions, false).then((resp: any) => {
        this.titlePositions = resp;
      });
      super.preLoadData(null);
    });
    this.formGroupTitle = this.formBuilder.group({
      IDBranch: [''],
      Id: new FormControl({ value: '', disabled: true }),
      Name: [''],
      IDAccountGroup: [''],
    });
  }

  loadedData(event?: any, ignoredFromGroup?: boolean): void {
    super.loadedData(event, ignoredFromGroup);
    if (this.item?.Type && this.item?.Type == 'STAFF') {
      this.isOpenTitlePosition = true;
    } else {
      this.isOpenTitlePosition = false;
    }
    if (this.item.TitlePosition?.length > 0 || !this.pageConfig.canEdit) {
      this.formGroup.get('Type').disable();
    } else {
      this.formGroup.get('Type').enable();
    }
    this.roleSelected = this.formGroup.get('Type').value;

    this.patchTitlePositionValue();
    this.patchUserAccountValue();
  }

  patchTitlePositionValue() {
    this.formGroup.controls.TitlePosition = new FormArray([]);
    if (this.item.TitlePosition?.length) {
      this.item.TitlePosition.forEach((i) => {
        this.addTitlePositionValue(i);
      });
    }
    if (!this.pageConfig.canEdit) {
      this.formGroup.controls.TitlePosition.disable();
    } else {
      this.formGroup.controls.TitlePosition.enable();
    }
  }

  changeType(e) {
    if (e.Name == 'STAFF') {
      this.isOpenTitlePosition = true;
    } else {
      this.isOpenTitlePosition = false;
    }
    this.roleSelected = e.Name;
    this.formGroup.controls.Type.setValue(e.Name);
    this.formGroup.controls.Type.markAsDirty();
    this.saveChange();
  }

  presentPopoverTitlePosition(e: Event, fg = null) {
    if (fg?.value?.IDBranch) {
      this.formGroupTitle = fg;
    } else {
      this.formGroupTitle = this.formBuilder.group({
        IDBranch: [null],
        Id: [0],
        Name: [''],
        IDAccountGroup: [''],
      });
    }
    this.popoverTitlePosition.event = e;
    this.isPopoverTitlePositionOpen = true;
  }

  onTitlePositionChange() {
    const id = this.formGroupTitle.get('Id')?.value ?? 0;
    const idBranch = this.formGroupTitle.get('IDBranch')?.value;
    const name = this.titlePositions.find((p) => p.Id == idBranch)?.Name;
    if (this.submitAttempt == false && idBranch != null && idBranch != '') {
      this.submitAttempt = true;
      let submitItem = {
        IDBranch: idBranch,
        IDAccountGroup: this.item.Id,
        Id: id,
      };
      this.branchInGroupProvider
        .save(submitItem)
        .then((resp: any) => {
          if (!id) {
            let item = {
              Id: resp.Id,
              Name: name,
              IDAccountGroup: resp.IDAccountGroup,
              IDBranch: resp.IDBranch,
            };
            this.addTitlePositionValue(item);
          } else {
            this.formGroupTitle.get('Name').setValue(name);
          }
          const groups = this.formGroup.controls.TitlePosition as FormArray;
          if (groups.length > 0) {
            this.formGroup.get('Type').disable();
          } else {
            this.formGroup.get('Type').enable();
          }
          this.formGroupTitle.markAsPristine();
          this.cdr.detectChanges();
          this.env.showTranslateMessage('Saving completed!', 'success');
          this.submitAttempt = false;
          this.isPopoverTitlePositionOpen = false;
        })
        .catch((err) => {
          this.env.showTranslateMessage('Cannot save, please try again', 'danger');
          this.submitAttempt = false;
          this.isPopoverTitlePositionOpen = false;
        });
    }
  }

  addTitlePositionValue(line, markAsDirty = false) {
    let groups = <FormArray>this.formGroup.controls.TitlePosition;
    let group = this.formBuilder.group({
      Id: [line.Id],
      Name: [line?.Name],
      IDAccountGroup: [this.item.Id],
      IDBranch: [line?.IDBranch],
    });
    groups.push(group);
    if (markAsDirty) {
      group.get('Id').markAsDirty();
      group.get('IDBranch').markAsDirty();
      group.get('IDAccountGroup').markAsDirty();
    }
  }

  removeTitlePosition(fg, j) {
    let groups = <FormArray>this.formGroup.controls.TitlePosition;
    let itemToDelete = fg.getRawValue();
    this.env.showPrompt('Bạn chắc muốn xóa ?', null, 'Xóa ' + 1 + ' dòng').then((_) => {
      this.branchInGroupProvider.delete(itemToDelete).then((result) => {
        groups.removeAt(j);
        if (groups.length > 0) {
          this.formGroup.get('Type').disable();
        } else {
          this.formGroup.get('Type').enable();
        }
      });
    });
  }

  patchUserAccountValue() {
    this.formGroup.controls.UserAccount = new FormArray([]);
    if (this.item.UserAccount?.length) {
      this.item.UserAccount.forEach((i) => {
        this.addUserAccountValue(i);
      });
    }
    if (!this.pageConfig.canEdit) {
      this.formGroup.controls.UserAccount.disable();
    } else {
      this.formGroup.controls.UserAccount.enable();
    }
  }

  addUserAccountValue(line, markAsDirty = false) {
    let searchInput$ = new Subject<string>();
    let groups = <FormArray>this.formGroup.controls.UserAccount;
    let selected = {
      Id: line?.IDUser,
      FullName: line?.Name,
    };
    let group = this.formBuilder.group({
      Id: [line?.Id],
      _UserSearchLoading: [false],
      existedUsers: [groups.controls.map((d) => d.get('IDUser').value)],
      _UserSearchInput: [searchInput$],
      _UserDataSource: [
        of([selected]).pipe(
          merge(
            searchInput$.pipe(
              distinctUntilChanged(),
              tap(() => group.controls._UserSearchLoading.setValue(true)),
              switchMap((term) => {
                return from(
                  this.accountUserProvider.read({
                    SortBy: ['Id_desc'],
                    Take: 20,
                    Skip: 0,
                    FullName: term,
                    Role: this.roleSelected,
                    Id_ne: group.controls.existedUsers.value.length > 0 ? group.controls.existedUsers.value : [],
                  }),
                ).pipe(
                  map((items) => items['data']),
                  catchError(() => of([])),
                  tap(() => group.controls._UserSearchLoading.setValue(false)),
                );
              }),
            ),
          ),
        ),
      ],

      IDAccountGroup: [this.item.Id],
      IDUser: [line?.IDUser],
      Name: [line?.Name],
    });
    groups.push(group);
    if (markAsDirty) {
      group.get('Id').markAsDirty();
      group.get('IDAccountGroup').markAsDirty();
      group.get('IDUser').markAsDirty();
      group.get('Name').markAsDirty();
    }
  }

  changeUser(e, fg) {
    if (this.submitAttempt == false) {
      this.submitAttempt = true;
      let user = {
        IDAccountGroup: this.item.Id,
        IDUser: e.Id,
        Name: e.FullName,
        Id: fg.controls.Id.value ?? 0,
      };
      this.userInGroupProvider
        .save(user)
        .then((resp: any) => {
          fg.get('Id').setValue(resp.Id);
          fg.markAsPristine();
          this.cdr.detectChanges();
          this.env.showTranslateMessage('Saving completed!', 'success');
          this.submitAttempt = false;
        })
        .catch((err) => {
          this.env.showTranslateMessage('Cannot save, please try again', 'danger');
          this.submitAttempt = false;
        });
    }
  }

  removeUserAccount(fg, j) {
    let groups = <FormArray>this.formGroup.controls.UserAccount;
    let itemToDelete = fg.getRawValue();
    this.env.showPrompt('Bạn chắc muốn xóa ?', null, 'Xóa ' + 1 + ' dòng').then((_) => {
      this.userInGroupProvider.delete(itemToDelete).then((result) => {
        groups.removeAt(j);
      });
    });
  }

  async saveChange() {
    super.saveChange2();
  }

  savedChange(savedItem = null, form = this.formGroup) {
    super.savedChange(savedItem, form);
    if (!this.item.TitlePosition && !this.item.UserAccount) {
      this.refresh();
    }
  }
}
