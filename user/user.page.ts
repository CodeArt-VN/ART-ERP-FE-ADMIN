import { Component } from '@angular/core';
import { NavController, ModalController, AlertController, LoadingController, PopoverController } from '@ionic/angular';
import { EnvService } from 'src/app/services/core/env.service';
import { PageBase } from 'src/app/page-base';
import { BRA_BranchProvider, SYS_TranslateProvider } from 'src/app/services/static/services.service';
import { Location } from '@angular/common';
import { environment } from 'src/environments/environment';
import { ACCOUNT_ApplicationUserProvider } from 'src/app/services/custom.service';

@Component({
  selector: 'app-user',
  templateUrl: 'user.page.html',
  styleUrls: ['user.page.scss'],
})
export class UserPage extends PageBase {

  constructor(
    public pageProvider: ACCOUNT_ApplicationUserProvider,
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

  loadedData(event) {
    this.items.forEach((i) => {
      i.Avatar = environment.staffAvatarsServer + i.Code + '.jpg';
    });
    super.loadedData(event);
  }
  archiveItems(publishEventCode = this.pageConfig.pageName) {
    if (this.pageConfig.canArchive){
      if (this.query.IsDisabled) {
        this.pageProvider.commonService.connect('PUT','Account/EnableAccount/'+this.selectedItems.map(s=>s.Id).join(','),null).toPromise().then(() => {
          this.env.showMessage('Reopened {{value}} lines!', 'success', this.selectedItems.length);
        })
      }
      else{
        this.pageProvider.commonService.connect('PUT','Account/DisableAccount/'+this.selectedItems.map(s=>s.Id).join(','),null).toPromise().then(() => {
          this.env.showMessage('Archived {{value}} lines!', 'success', this.selectedItems.length);
        })
      }
        this.removeSelectedItems();
    }
    }
}
