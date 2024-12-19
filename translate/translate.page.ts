import { ChangeDetectorRef, Component } from '@angular/core';
import { NavController, ModalController, AlertController, LoadingController, PopoverController } from '@ionic/angular';
import { EnvService } from 'src/app/services/core/env.service';
import { PageBase } from 'src/app/page-base';
import { BRA_BranchProvider, SYS_TranslateProvider } from 'src/app/services/static/services.service';
import { Location } from '@angular/common';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { SYS_Translate } from 'src/app/models/model-list-interface';
import { lib } from 'src/app/services/static/global-functions';

@Component({
    selector: 'app-translate',
    templateUrl: 'translate.page.html',
    styleUrls: ['translate.page.scss'],
    standalone: false
})
export class TranslatePage extends PageBase {
  languageList: [];
  constructor(
    public pageProvider: SYS_TranslateProvider,
    public branchProvider: BRA_BranchProvider,
    public modalController: ModalController,
    public popoverCtrl: PopoverController,
    public alertCtrl: AlertController,
    public formBuilder: FormBuilder,
    public cdr: ChangeDetectorRef,
    public loadingController: LoadingController,
    public env: EnvService,
    public navCtrl: NavController,
    public location: Location,
  ) {
    super();
  }

  preLoadData(event) {
    this.query.SortBy = 'ModifiedDate_desc';

    Promise.all([this.env.getType('Languages')]).then((values: any) => {
      this.languageList = values[0];
      super.preLoadData(event);
    });
  }

  add(): void {
    this.items.unshift({
      Id: 0,
      Code: '',
      Lang1: '',
      Lang2: '',
      Lang3: '',
      Lang4: '',
      Lang5: '',
      Lang6: '',
      Lang7: '',
      Lang8: '',
      Lang9: '',
    }); //Add new row to top of list

    this.editRow(this.items[0]);
  }

  editRow(row) {
    row.isEdit = true;
    //Create formGroup of row
    row._formGroup = this.formBuilder.group({
      Id: new FormControl({ value: row.Id, disabled: true }),
      Code: [row.Code, Validators.required],
      Lang1: [row.Lang1],
      Lang2: [row.Lang2],
      Lang3: [row.Lang3],
      Lang4: [row.Lang4],
      Lang5: [row.Lang5],
      Lang6: [row.Lang6],
      Lang7: [row.Lang7],
      Lang8: [row.Lang8],
      Lang9: [row.Lang9],
    });
  }
  cancelRow(row) {
    if (row.Id === 0) {
      this.items = this.items.filter((e) => e.Id !== 0);
    } else {
      row.isEdit = false;
    }
  }

  saveRow(row) {
    this.saveChange2(row._formGroup, '')
      .then((data: SYS_Translate) => {
        if (row.Id === 0 && data) {
          lib.copyPropertiesValue(data, row);
        } else {
          lib.copyPropertiesValue(row._formGroup.value, row);
        }
        row.isEdit = false;
      })
      .catch((err) => {
        if (err.error?.InnerException?.InnerException?.ExceptionMessage?.includes('Cannot insert duplicate key row')) {
          debugger;
          this.env.showMessage('Cannot insert duplicate key resource', 'danger');
        } else {
          this.env.showMessage('Cannot save, please try again', 'danger');
        }
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
              this.env.showMessage('Download success', 'success');
              if (loading) loading.dismiss();
              this.submitAttempt = false;
            })
            .catch((err) => {
              this.env.showMessage('Cannot download, please try again', 'danger');
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
