import { Component } from '@angular/core';
import { AlertController, LoadingController, ModalController, NavController } from '@ionic/angular';
import { PageBase } from 'src/app/page-base';
import { EnvService } from 'src/app/services/core/env.service';
import {
  BRA_BranchProvider,
  SYS_FormProvider,
  SYS_PermissionListProvider,
} from 'src/app/services/static/services.service';

import { lib } from 'src/app/services/static/global-functions';
import { FormDetailPage } from '../form-detail/form-detail.page';

@Component({
  selector: 'app-permission',
  templateUrl: 'permission.page.html',
  styleUrls: ['permission.page.scss'],
})
export class PermissionPage extends PageBase {
  showCheckedOnly = false;
  isAllRowOpened = false;
  ctrlOrCmdPressed = false;

  constructor(
    public pageProvider: SYS_PermissionListProvider,
    public formProvider: SYS_FormProvider,
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
    Promise.all([
      this.formProvider.read(this.formQuery),
      // this.branchProvider.read({
      //     Id: this.env.selectedBranchAndChildren
      // })
    ]).then((values) => {
      this.buildFlatTree(values[0]['data'], this.formList, false).then((resp: any) => {
        this.formList = resp;
      });

      // this.buildFlatTree(values[1]['data'], this.deparmentList, true).then((resp: any) => {
      //     this.deparmentList = resp;
      // });

      super.preLoadData(event);
    });
    //this.branchSearch();
  }

  loadData(event) {
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
    this.pageProvider.read(this.query).then((resp: any) => {
      this.items = resp.data;
      this.formList.forEach((form) => {
        let permission = this.items.find((d) => d.IDForm == form.Id);
        let check = permission && permission.Visible ? true : false;
        form.checked = check;
        form.disabled = false;
      });

      super.loadedData(null);
      if (this.selectedBranch) {
        setTimeout(() => {
          this.env.setStorage('permission_selectedBranchID', this.selectedBranch.Id);
          this.isTrackChange = true;
        }, 0);
      }
    });
  }

  changePermission(form, parentOnly = false, childrenOnly = false) {
    if (this.isTrackChange && this.selectedBranch && !form._submitAttempt) {
      let permission = this.items.find((d) => d.IDForm == form.Id);
      if (!permission) {
        permission = {
          IDBranch: this.selectedBranch.Id,
          IDForm: form.Id,
          Id: 0,
        };
        this.items.push(permission);
      }

      if (permission.Visible != form.checked) {
        permission.Visible = form.checked;
        form._submitAttempt = true;

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
}
