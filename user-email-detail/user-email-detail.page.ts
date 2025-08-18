import { Component, ChangeDetectorRef } from '@angular/core';
import { NavController, ModalController, NavParams, LoadingController, AlertController } from '@ionic/angular';
import { PageBase } from 'src/app/page-base';
import { ActivatedRoute } from '@angular/router';
import { EnvService } from 'src/app/services/core/env.service';
import { FormBuilder, Validators, FormControl } from '@angular/forms';
import { GoogleAdminSyncService } from 'src/app/services/google-admin.service';

@Component({
	selector: 'app-user-email-detail',
	templateUrl: './user-email-detail.page.html',
	styleUrls: ['./user-email-detail.page.scss'],
	standalone: false,
})
export class UserEmailDetailPage extends PageBase {
	item: any;
	
	googleAccessToken: string = '';
	passwordViewType: string = 'password';
	isNewUser: boolean = false;

	constructor(
		public googleAdminSync: GoogleAdminSyncService,
		public env: EnvService,
		public navCtrl: NavController,
		public route: ActivatedRoute,
		public modalController: ModalController,
		public alertCtrl: AlertController,
		public navParams: NavParams,
		public formBuilder: FormBuilder,
		public cdr: ChangeDetectorRef,
		public loadingController: LoadingController
	) {
		super();
		this.pageConfig.isDetailPage = true;
		
		this.formGroup = formBuilder.group({
			primaryEmail: ['', [Validators.required, Validators.email]],
			name: this.formBuilder.group({
				fullName: ['', Validators.required]
			}),
			phones: this.formBuilder.group({
				fullName: ['', Validators.required]
			}),
			password: [''],
			confirmPassword: [''],
		});

		this.formGroup.valueChanges.subscribe((change) => {
			if (change.password && change.password !== change.confirmPassword) {
				this.formGroup.get('confirmPassword').setErrors({ mismatch: true });
			} else if (change.password === change.confirmPassword) {
				this.formGroup.get('confirmPassword').setErrors(null);
			}
		});
	}

	preLoadData() {
		if (this.navParams) {
			this.item = this.navParams.data.googleUser;
			this.googleAccessToken = this.navParams.data.googleAccessToken;
			this.isNewUser = this.item?.IsNew || false;

			if (this.googleAccessToken) {
				this.googleAdminSync.setAccessToken(this.googleAccessToken);
			}

			if (this.item && !this.isNewUser) {
				this.formGroup.patchValue({
					primaryEmail: this.item.Email,
					givenName: this.item.FirstName || this.item.GoogleData?.name?.givenName,
					familyName: this.item.LastName || this.item.GoogleData?.name?.familyName,
					orgUnitPath: this.item.OrgUnitPath || '/',
					suspended: this.item.IsDisabled || false,
					changePasswordAtNextLogin: false
				});
			}

			this.cdr.detectChanges();
		}
	}

	async saveUser() {
		if (!this.formGroup.valid) {
			this.env.showMessage('Please check all required fields', 'warning');
			return;
		}

		const loading = await this.loadingController.create({
			message: this.isNewUser ? 'Creating user...' : 'Updating user...'
		});
		await loading.present();

		try {
			const formData = this.formGroup.getRawValue();

			if (this.isNewUser) {
				// Tạo user mới
				if (!formData.password) {
					throw new Error('Password is required for new user');
				}

				const newUser = await this.googleAdminSync.insertUser({
					primaryEmail: formData.primaryEmail,
					name: {givenName: formData.givenName,
					familyName: formData.familyName},
					ỏgUnitPath: formData.orgUnitPath,
					password: formData.password,
					orgUnitPath: formData.orgUnitPath
				});

				this.env.showMessage('User created successfully', 'success');
				this.modalController.dismiss({ updated: true });
			} else {
				// Update user hiện tại
				await this.googleAdminSync.updateUser(this.item.Email, {
					givenName: formData.givenName,
					familyName: formData.familyName,
					organizationUnit: formData.orgUnitPath,
					suspended: formData.suspended
				});

				this.env.showMessage('User updated successfully', 'success');
				this.modalController.dismiss({ updated: true });
			}
		} catch (error) {
			this.env.showMessage(`Error: ${error.message}`, 'danger');
		} finally {
			loading.dismiss();
		}
	}

	togglePasswordVisibility() {
		this.passwordViewType = this.passwordViewType === 'password' ? 'text' : 'password';
	}
	changeEmail(){

	}

}