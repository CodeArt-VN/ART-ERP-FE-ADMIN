

import { Component, ChangeDetectorRef } from '@angular/core';
import { NavController, ModalController, LoadingController, AlertController } from '@ionic/angular';
import { PageBase } from 'src/app/page-base';
import { ActivatedRoute } from '@angular/router';
import { EnvService } from 'src/app/services/core/env.service';
import {
  BRA_BranchProvider,
  CRM_ContactProvider,
  WEB_ContentProvider,
} from 'src/app/services/static/services.service';
import { FormBuilder} from '@angular/forms';
import { CommonService } from 'src/app/services/core/common.service';
import { DynamicScriptLoaderService } from 'src/app/services/custom.service';

@Component({
  selector: 'app-help-detail-page',
  templateUrl: './help-detail.page.html',
  styleUrls: ['./help-detail.page.scss'],
})
export class HelpDetailPage extends PageBase {
   
  _helpCode;
  constructor(
    public pageProvider: WEB_ContentProvider,
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
    //default code
    this._helpCode = 'help/' + this.route.snapshot.paramMap.get('code');
    this.env.getStorage('lang').then((lang) => {
      // get language then set the default code
      this._helpCode = `help/${lang}/${this.route.snapshot.paramMap.get('code')}`;
    });
    this.env.getEvents().subscribe((data) => {
      if (data.Code == 'app:changeLanguage') {
        // listen event changeLanguage then set the default code
        this._helpCode = `help/${data.Value}/${this.route.snapshot.paramMap.get('code')}`;
      }
    });
  }
}