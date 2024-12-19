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
    standalone: false
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
    deleteItems(publishEventCode = this.pageConfig.pageName) {
      if (this.pageConfig.canDelete) {
        this.env
          .showPrompt(
            {
              code: 'You can not undo this action.',
              value: this.selectedItems.length,
            },
            null,
            { code: 'Are you sure you want to delete the {{value}} selected item(s)?', value: this.selectedItems.length },
          )
          .then((_) => {
            this.env
              .showLoading('Please wait for a few moments',  this.pageProvider.commonService.connect('PUT','Account/DeleteAccount/'+this.selectedItems.map(s=>s.Id).join(','),null).toPromise())
              .then((_) => {
                this.removeSelectedItems();
                this.env.showMessage('Deleted!', 'success');
                this.env.publishEvent({ Code: publishEventCode });
              })
              .catch((err) => {
                this.env.showMessage('Không xóa được, xin vui lòng kiểm tra lại.');
                console.log(err);
              });
          });
      }
    }
  
}
