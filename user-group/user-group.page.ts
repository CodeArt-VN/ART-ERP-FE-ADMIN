import { Component } from '@angular/core';
import { NavController, ModalController, AlertController, LoadingController, PopoverController } from '@ionic/angular';
import { EnvService } from 'src/app/services/core/env.service';
import { PageBase } from 'src/app/page-base';
import { BRA_BranchProvider, SYS_AccountGroupProvider } from 'src/app/services/static/services.service';
import { Location } from '@angular/common';
import { ACCOUNT_ApplicationUserProvider } from 'src/app/services/custom.service';

@Component({
	selector: 'app-user-group',
	templateUrl: 'user-group.page.html',
	styleUrls: ['user-group.page.scss'],
	standalone: false,
})
export class UserGroupPage extends PageBase {
	roleDataSource: any = [];
	constructor(
		public pageProvider: SYS_AccountGroupProvider,
		public accountUserProvider: ACCOUNT_ApplicationUserProvider,
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
		Promise.all([this.accountUserProvider.commonService.connect('GET', 'Account/GetRoles', null).toPromise()]).then((values) => {
			this.roleDataSource = values[0];
			this.roleDataSource = this.roleDataSource.map(d=> {return {...d,Code:d.Id}});
			console.log(this.roleDataSource);
		});
		super.preLoadData(event);
	}
}
