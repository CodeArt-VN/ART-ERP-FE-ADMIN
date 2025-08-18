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
	googleAccessToken: string = '' 
	
	isLoadingFromGoogle: boolean = false;

	
	GOOGLE_CONFIG = {
		clientId: '',
		clientSecret: '',
		//redirectUri: 'http://localhost:54009/auth/google/callback',
		scopes: 'https://www.googleapis.com/auth/admin.directory.user',
		domain: 'indining.com.vn',
		maxResults: 500
	};

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
		this.query.Take = 5000;
		this.pageConfig.forceLoadData = false;
	}

	ionViewWillEnter() {
		super.ionViewWillEnter();
		
		
	}

	async loadData(event?: any): Promise<void> {
		const token = this.googleAccessToken;
		
		if (!token) {
			this.env.showMessage('Please enter Google Access Token first', 'warning');
			this.items = [];
			this.loadedData(event);
			return;
		}

		this.isLoadingFromGoogle = true;
		this.pageConfig.showSpinner = true;

		try {
			this.googleAdminSync.setAccessToken(token);
			const response = await this.googleAdminSync.listUsers({domain: this.GOOGLE_CONFIG.domain, maxResults: 500});
			
			if (response.users) {
				this.items = response.users.map(user => ({
					Id: user.id,
					Email: user.primaryEmail,
					FullName: user.name?.fullName || '',
					FirstName: user.name?.givenName || '',
					LastName: user.name?.familyName || '',
					Avatar: user.thumbnailPhotoUrl || 'assets/avartar-empty.jpg',
					IsDisabled: user.suspended || false,
					LastLoginTime: user.lastLoginTime || '',
					CreationTime: user.creationTime || '',
					OrgUnitPath: user.orgUnitPath || '',
					GoogleData: user
				}));

				this.env.showMessage(`Loaded ${this.items.length} users from Google Admin`, 'success');
			} else {
				this.items = [];
				this.env.showMessage('No users found in Google Admin', 'warning');
			}
		} catch (error) {
			this.items = [];
			this.env.showMessage(`Error loading from Google: ${error.message}`, 'danger');
		} finally {
			this.isLoadingFromGoogle = false;
			this.pageConfig.showSpinner = false;
			this.loadedData(event);
		}
	}

	
	async testGoogleConnection() {
		const token = this.googleAccessToken;
		if (!token) {
			this.env.showMessage('Please enter Google Access Token first', 'warning');
			return;
		}

		const loading = await this.loadingController.create({
			message: 'Testing connection...'
		});
		await loading.present();

		try {
			this.googleAdminSync.setAccessToken(token);
			const isConnected = await this.googleAdminSync.testConnection(this.GOOGLE_CONFIG.domain);
			
			if (isConnected) {
				this.env.showMessage('Google Admin API connected successfully!', 'success');
				this.loadData();
			} else {
				this.env.showMessage('Failed to connect to Google Admin API', 'danger');
			}
		} catch (error) {
			this.env.showMessage(`Connection error: ${error.message}`, 'danger');
		} finally {
			loading.dismiss();
		}
	}

	loadedData(event) {
		this.items.forEach((i) => {
			if (!i.Avatar || i.Avatar === 'assets/avartar-empty.jpg') {
				i.Avatar = 'assets/avartar-empty.jpg';
			}
		});

		super.loadedData(event);
	}

	async showModal(i) {
		const modal = await this.modalController.create({
			component: UserEmailDetailPage,
			componentProps: {
				item: i,
				id : i.Id,
				googleAccessToken: this.googleAccessToken
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