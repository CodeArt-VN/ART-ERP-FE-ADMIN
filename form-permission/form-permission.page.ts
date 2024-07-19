import { Component } from '@angular/core';
import { NavController, ModalController, AlertController, LoadingController } from '@ionic/angular';
import { EnvService } from 'src/app/services/core/env.service';
import { PageBase } from 'src/app/page-base';
import {
  BRA_BranchProvider,
  SYS_FormProvider,
  SYS_PermissionListProvider,
} from 'src/app/services/static/services.service';

@Component({
  selector: 'app-form-permission',
  templateUrl: 'form-permission.page.html',
  styleUrls: ['form-permission.page.scss'],
})
export class FormPermissionPage extends PageBase {
  showCheckedOnly = false;
  isAllRowOpened = false;
  itemsView = [];
  itemsState: any = [];
  formQuery = {
    Take: 5000,
    Skip: 0,
    Keyword: '',
    AllChildren: true,
    AllParent: true,
  };

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
  }

  preLoadData(event = null) {
    Promise.all([this.formProvider.read(this.formQuery)]).then((values) => {
      this.buildFlatTree(values[0]['data'], this.itemsState, this.isAllRowOpened).then((resp: any) => {
        this.itemsState = resp;
        this.itemsView = this.itemsState.filter((d) => d.show);
      });
      super.preLoadData(event);
    });
  }

  refresh() {
    this.preLoadData();
  }

  toggleRowAll() {
    this.isAllRowOpened = !this.isAllRowOpened;
    this.itemsState.forEach((i) => {
      i.showdetail = !this.isAllRowOpened;
      this.toggleRow(this.itemsState, i, true);
    });
    this.itemsView = this.itemsState.filter((d) => d.show);
  }

  toggleRow(ls, ite, toogle = false) {
    super.toggleRow(ls, ite, toogle);
    this.itemsView = this.itemsState.filter((d) => d.show);
  }

  viewPermission() {
    let selectedFormIds = this.selectedItems.map((s) => s.Id);
    let query = {
      IgnoredBranch: true,
      IDForm: selectedFormIds,
      Visible: true,
    };

    this.pageProvider.read(query).then((resp: any) => {
      this.itemsView.forEach((i) => {
        i._selected = selectedFormIds.indexOf(i.Id) > -1;
        i._groups = resp.data.filter((d) => d.IDForm == i.Id);
      });
    });
  }
}
