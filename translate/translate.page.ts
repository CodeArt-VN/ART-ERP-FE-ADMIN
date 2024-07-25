import { Component } from '@angular/core';
import { NavController, ModalController, AlertController, LoadingController, PopoverController } from '@ionic/angular';
import { EnvService } from 'src/app/services/core/env.service';
import { PageBase } from 'src/app/page-base';
import { BRA_BranchProvider, SYS_TranslateProvider } from 'src/app/services/static/services.service';
import { Location } from '@angular/common';

@Component({
  selector: 'app-translate',
  templateUrl: 'translate.page.html',
  styleUrls: ['translate.page.scss'],
})
export class TranslatePage extends PageBase {
  languageList: [];
  constructor(
    public pageProvider: SYS_TranslateProvider,
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
    Promise.all([this.env.getType('Languages')]).then((values: any) => {
      this.languageList = values[0];
      super.preLoadData(event);
    });
  }

  async downLoadLanguage(code) {
    if (this.submitAttempt) return;
    this.submitAttempt = true;
    const loading = await this.loadingController.create({
      cssClass: 'my-custom-class',
      message: 'Vui lòng chờ download dữ liệu',
    });
    await loading.present().then(() => {
      this.pageProvider
        .export({ Id: this.id })
        .then((response: any) => {
          this.pageProvider.commonService
            .connect('GET', 'SYS/Translate/i18n/', { code: code })
            .toPromise()
            .then((data: any) => {
              let dataConvert = this.convertArrayToObject(
                data.map((e) => {
                  return {
                    [e.Key]: e.Value,
                  };
                }),
              );
              const blob = new Blob([JSON.stringify(dataConvert)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const anchor = document.createElement('a');
              anchor.href = url;
              anchor.download = code;
              document.body.appendChild(anchor);
              anchor.click();
              document.body.removeChild(anchor);
              URL.revokeObjectURL(url);
              this.env.showTranslateMessage('Download success', 'success');
              if (loading) loading.dismiss();
              this.submitAttempt = false;
            })
            .catch((err) => {
              this.env.showTranslateMessage('Cannot download, please try again', 'danger');
              if (loading) loading.dismiss();
              this.submitAttempt = false;
            });
        })
        .catch((err) => {
          this.submitAttempt = false;
        });
    });
  }

  convertArrayToObject(arr: any[]): any {
    return arr.reduce((accumulator, currentObject) => {
      const key = Object.keys(currentObject)[0];
      const value = currentObject[key];
      return { ...accumulator, [key]: value };
    }, {});
  }
}
