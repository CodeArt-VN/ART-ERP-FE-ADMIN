import { Component } from '@angular/core';
import { NavController, ModalController, AlertController, LoadingController } from '@ionic/angular';
import { EnvService } from 'src/app/services/core/env.service';
import { PageBase } from 'src/app/page-base';
import { UserEmailDetailPage } from '../user-email-detail/user-email-detail.page';
import { ACCOUNT_ApplicationUserProvider } from 'src/app/services/custom.service';
import { GoogleAdminSyncService } from 'src/app/services/google-admin.service';

@Component({
	selector: 'app-user-email',
	templateUrl: 'user-email.page.html',
	styleUrls: ['user-email.page.scss'],
	standalone: false,
})
export class UserEmailPage extends PageBase {
	googleAccessToken: string = '';

	domain: string = 'indining.com.vn';
	
	constructor(
		public pageProvider: ACCOUNT_ApplicationUserProvider,
		public googleAdminSync: GoogleAdminSyncService,
		public modalController: ModalController,
		public alertCtrl: AlertController,
		public loadingController: LoadingController,
		public env: EnvService,
		public navCtrl: NavController
	) {
		super();
		this.query.Take = 500;
		this.pageConfig.forceLoadData = false;
	}

	// preLoadData() {

	// 	if(!this.googleAccessToken) this.signIn();
	// 	super.preLoadData();
	// }

	// async signIn() {
	// 	if(!this.loginUser || !this.loginPassword) return;

	// 	this.googleAccessToken = await this.googleAdminSync.signIn(this.loginUser, this.loginPassword, this.tokenEndpoint);
	// 	console.log(this.googleAccessToken);
	// 	//await this.loadData();
	// }

	

	loadData(event = null) {
		const token = this.googleAccessToken;

		if (!token) {
			this.env.showMessage('Please enter Google Access Token', 'warning');
			this.items = [];
			this.loadedData(event);
			return;
		}
		if (this.pageProvider && !this.pageConfig.isEndOfData) {
			this.query.Skip = this.items.length;
			this.googleAdminSync.setAccessToken(token);
			this.env
				.showLoading('Please wait for a few moments', this.googleAdminSync.listUsers({ domain: this.domain, maxResults: this.query.Take }))
				.then((result: any) => {
					if (result.users.length == 0) {
						this.pageConfig.isEndOfData = true;
					}
					if (result.users.length > 0) {
						let firstRow = result.users[0];

						//Fix dupplicate rows
						if (this.items.findIndex((d) => d.Id == firstRow.Id) == -1) {
							this.items = [...this.items, ...result.users];
						}
					}

					this.loadedData(event);
				
				})
				.catch((err: any) => {
					if (err.message != null) {
						this.env.showMessage(err.message, 'danger');
					} else {
						this.env.showMessage('Cannot extract data', 'danger');
					}

					this.loadedData(event);
				});
		} else {
			this.loadedData(event);
		}
	}

	loadedData(event?: any, ignoredFromGroup?: boolean): void {
		this.items = this.items.map((user) => ({
			Id: user.id,
			Email: user.primaryEmail,
			FullName: user.name?.fullName || '',
			FirstName: user.name?.givenName || '',
			LastName: user.name?.familyName || '',
			Avatar: user.thumbnailPhotoUrl || 'assets/avartar-empty.jpg',
			IsDisabled: user.suspended || false,
			OrgUnitPath: user.orgUnitPath || '',
			Phones: user.phones || [],
			Image: user.thumbnailPhotoUrl,
		}));
		super.loadedData(event, ignoredFromGroup);
	}

	async showModal(i) {
		const modal = await this.modalController.create({
			component: UserEmailDetailPage,
			componentProps: {
				item: i,
				id: i.Id,
				googleAccessToken: this.googleAccessToken,
			},
			cssClass: 'my-custom-class',
		});

		modal.onDidDismiss().then((result) => {
			if (result.data && result.data.updated) {
				this.loadData();
			}
		});

		return await modal.present();
	}

	add() {
		// Tạo user mới cho Google
		let newUser = {
			Id: 0,
			IsDisabled: false,
		};
		this.showModal(newUser);
	}
}
