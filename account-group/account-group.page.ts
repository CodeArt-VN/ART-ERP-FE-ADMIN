import { Component } from '@angular/core';
import { NavController, ModalController, AlertController, LoadingController, PopoverController } from '@ionic/angular';
import { EnvService } from 'src/app/services/core/env.service';
import { PageBase } from 'src/app/page-base';
import { BRA_BranchProvider, SYS_AccountGroupProvider } from 'src/app/services/static/services.service';
import { Location } from '@angular/common';

@Component({
	selector: 'app-account-group',
	templateUrl: 'account-group.page.html',
	styleUrls: ['account-group.page.scss'],
	standalone: false,
})
export class AccountGroupPage extends PageBase {
	constructor(
		public pageProvider: SYS_AccountGroupProvider,
		public branchProvider: BRA_BranchProvider,
		public modalController: ModalController,
		public popoverCtrl: PopoverController,
		public alertCtrl: AlertController,
		public loadingController: LoadingController,
		public env: EnvService,
		public navCtrl: NavController,
		public location: Location
	) {
		super();
	}

	preLoadData(event) {
		this.sort.Id = 'Id';
		this.sortToggle('Id', true);
		super.preLoadData(event);
	}
}
