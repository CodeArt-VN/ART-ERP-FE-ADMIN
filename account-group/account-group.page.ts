import { Component } from '@angular/core';
import { NavController, ModalController, AlertController, LoadingController, PopoverController } from '@ionic/angular';
import { EnvService } from 'src/app/services/core/env.service';
import { PageBase } from 'src/app/page-base';
import { BRA_BranchProvider, HRM_StaffProvider, SYS_RoleProvider, SYS_TranslateProvider } from 'src/app/services/static/services.service';
import { Location } from '@angular/common';


@Component({
  selector: 'app-account-group',
  templateUrl: 'account-group.page.html',
  styleUrls: ['account-group.page.scss'],
})
export class AccountGroupPage extends PageBase {

  constructor(
    public pageProvider: SYS_RoleProvider,
    public branchProvider: BRA_BranchProvider,
    public modalController: ModalController,
    public popoverCtrl: PopoverController,
    public alertCtrl: AlertController,
    public loadingController: LoadingController,
    public env: EnvService,
    public navCtrl: NavController,
    public location: Location,
  ) {
    super();
    
  }

  preLoadData(event) {
    this.sort.Id = 'Id';
    this.sortToggle('Id', true);
    super.preLoadData(event);
  }


  // loadedData(event) {
  //   this.items.forEach((i) => {
  //     i.Avatar = environment.staffAvatarsServer + i.Code + '.jpg';
  //   });

  //   super.loadedData(event);
  // }
}
