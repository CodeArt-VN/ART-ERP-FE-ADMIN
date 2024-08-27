import { Component } from '@angular/core';
import { AlertController, LoadingController, ModalController, NavController } from '@ionic/angular';
import { PageBase } from 'src/app/page-base';
import { EnvService } from 'src/app/services/core/env.service';
import {
  BRA_BranchProvider,
  SYS_AccountGroupProvider,
  SYS_FormProvider,
  SYS_PermissionListProvider,
} from 'src/app/services/static/services.service';

import { lib } from 'src/app/services/static/global-functions';
import { FormDetailPage } from '../form-detail/form-detail.page';
import { environment } from 'src/environments/environment';
import { isForOfStatement } from 'typescript';

@Component({
  selector: 'app-permission',
  templateUrl: 'permission.page.html',
  styleUrls: ['permission.page.scss'],
})
export class PermissionPage extends PageBase {
  showCheckedOnly = false;
  isAllRowOpened = false;
  ctrlOrCmdPressed = false;
  isDevMode = !environment.production
  accountGroupList;
  isTrackChangeGroup = false;
  selectedGroup : any;
  constructor(
    public pageProvider: SYS_PermissionListProvider,
    public formProvider: SYS_FormProvider,
    public accountGroupProvider: SYS_AccountGroupProvider,
    public branchProvider: BRA_BranchProvider,
    public modalController: ModalController,
    public alertCtrl: AlertController,
    public loadingController: LoadingController,
    public env: EnvService,
    public navCtrl: NavController,
  ) {
    super();
    this.query.Take = 5000;
    this.query.AllChildren = true;
    this.query.AllParent = true;
    this.pageConfig.isShowFeature = true;
    window.addEventListener('keydown', (event) => {
      if (event.ctrlKey || event.metaKey) {
        this.ctrlOrCmdPressed = true;
      }
    });

    window.addEventListener('keyup', (event) => {
      if (!event.ctrlKey && !event.metaKey) {
        this.ctrlOrCmdPressed = false;
      }
    });
  }

  formList = [];
  formQuery = {
    Take: 5000,
    Skip: 0,
    Keyword: '',
    AllChildren: true,
    AllParent: true,
  };

  deparmentList = [];
  preLoadData(event = null) {
    if (this.pageConfig.canViewAllData) {
      Promise.all([this.formProvider.read(this.formQuery),this.accountGroupProvider.read(this.formQuery)]).then((values : any) => {
        this.buildFlatTree(values[0]['data'], this.formList, false).then((resp: any) => {
          this.formList = resp;
        });
        if(values[1] && values[1].data)this.accountGroupList = values[1].data;
 

        super.preLoadData(event);
      });
    } else {
      this.formList = lib.cloneObject(this.env.user.Forms);
      super.preLoadData(event);
    }
  }

  loadData(event) {
    // super.loadedData(); 
    if(this.segmentView == 's1'){
      this.env.getStorage('permission_selectedAccountGroupID').then((value) => {
        if (value) {
          let savedId = value;
          this.accountGroupProvider.getAnItem(savedId).then((resp: any) => {
            this.selectedGroup = resp;
            this.selectGroup();
          });
        } else {
          super.loadedData();
        }
      });
    }
    else{
      this.env.getStorage('permission_selectedBranchID').then((value) => {
        if (value) {
          let savedId = value;
          this.branchProvider.getAnItem(savedId).then((resp: any) => {
            this.selectedBranch = resp;
            this.selectBranch();
          });
        } else {
          super.loadedData();
        }
      });
    }
  }

  refresh() {
    this.preLoadData();
  }

  toggleRowAll() {
    this.isAllRowOpened = !this.isAllRowOpened;
    this.formList.forEach((i) => {
      i.showdetail = !this.isAllRowOpened;
      this.toggleRow(this.formList, i, true);
    });
  }

  async showForm(i) {
    const modal = await this.modalController.create({
      component: FormDetailPage,
      componentProps: {
        items: this.formList,
        item: i,
        id: i.Id,
      },
      cssClass: 'my-custom-class',
    });
    return await modal.present();
  }

  isTrackChange = true;
  selectBranch() {
    //this.selectedGroup = null;
    if (!this.selectedBranch || this.selectedBranch.Type != 'TitlePosition') {
      this.items = [];
      this.isTrackChange = false;
      this.selectedBranch = null;

      for (let i = 0; i < this.formList.length; i++) {
        this.formList[i].checked = false;
        this.formList[i].disabled = true;
      }
      this.isTrackChange = true;
      return;
    }

    if (document.body.clientWidth < 768) {
      this.pageConfig.showSpinner = true;
      this.pageConfig.isShowFeature = false;
    }

    this.isTrackChange = false;
    this.selectedBranch.CanViewDataInObject = JSON.parse(this.selectedBranch.CanViewDataIn);
    this.query.IDBranch = this.selectedBranch.Id;
    this.query.IDAccountGroup = undefined;
    this.env .showLoading('Please wait for a few moments',   this.pageProvider.read(this.query))
    .then((resp:any) => {  
      this.items = resp.data;
      this.formList.forEach((form) => {
        let permission = this.items.find((d) => d.IDForm == form.Id);
        let check = permission && permission.Visible ? true : false;
        form.checked = check;
        form.disabled = false;})
        super.loadedData(null);
      if (this.selectedBranch) {
        setTimeout(() => {
          this.env.setStorage('permission_selectedBranchID', this.selectedBranch.Id);
          this.isTrackChange = true;
        }, 0);
      }
    });
  }

  selectGroup(){
    if(this.isTrackChangeGroup)
    this.selectedBranch = null;
    this.query.IDBranch = undefined;
    this.query.IDAccountGroup = this.selectedGroup.Id;
    this.env .showLoading('Please wait for a few moments',    this.pageProvider.read(this.query))
    .then((resp: any) => {
      this.items = resp.data;
      this.formList.forEach((form) => {
        let permission = this.items.find((d) => d.IDForm == form.Id);
        let check = permission && permission.Visible ? true : false;
        form.checked = check;
        form.disabled = false;
      });

      super.loadedData(null);
      if (this.selectedGroup) {
        setTimeout(() => {
          this.env.setStorage('permission_selectedAccountGroupID', this.selectedGroup.Id);
          this.isTrackChange = true;
        }, 0);
      }
  })
}
  changePermission(form, parentOnly = false, childrenOnly = false) {

    if (this.isTrackChange && (this.selectedBranch || this.selectedGroup) && !form._submitAttempt && this.pageConfig.canEdit) {
      let permission = this.items.find((d) => d.IDForm == form.Id);
      if (!permission) {
        permission = {
          IDBranch: this.selectedBranch?.Id,
          IDAccountGroup: this.selectedGroup?.Id,
          IDForm: form.Id,
          Id: 0,
        };
        this.items.push(permission);
      }

      if (permission.Visible != form.checked) {
        permission.Visible = form.checked;
        form._submitAttempt = true;
        if(this.selectedBranch) permission.IDAccountGroup = null;
        else permission.IDBranch = null;
        this.pageProvider.save(permission).then((resp: any) => {
          permission.Id = resp.Id;
          form._submitAttempt = false;
          if (form.IDParent && form.checked && !childrenOnly) {
            let parent = this.formList.find((d) => d.Id == form.IDParent);
            if (parent && !parent.checked) {
              parent.checked = true;
              this.changePermission(parent, true, false);
            }
          }

          if (!parentOnly && (this.ctrlOrCmdPressed || !form.checked)) {
            let childrenForms = this.formList.filter((d) => d.IDParent == form.Id);
            if (childrenForms.length) {
              childrenForms.forEach((i) => {
                if (i.checked != form.checked) {
                  i.checked = form.checked;
                  this.changePermission(i, false, true);
                }
              });
            }
          }
        });
      }
    }
  }

  selectedBranch = null;
  searchResultIdList = { term: '', ids: [] };
  searchShowAllChildren = (term: string, item: any) => {
    if (this.searchResultIdList.term != term) {
      this.searchResultIdList.term = term;
      this.searchResultIdList.ids = lib.searchTreeReturnId(this.env.jobTitleList, term);
    }
    return this.searchResultIdList.ids.indexOf(item.Id) > -1;
  };

  updateBranch() {
    this.selectedBranch.CanViewDataIn = JSON.stringify(this.selectedBranch.CanViewDataInObject);
    this.branchProvider.save(this.selectedBranch).then((_) => {});
  }
  segmentView = 's1';
  segmentChanged(ev: any) {
    this.segmentView = ev.detail.value;
    if(this.segmentView == 's1') this.selectGroup();
    else if(this.segmentView == 's2') this.selectBranch();
  }
}
