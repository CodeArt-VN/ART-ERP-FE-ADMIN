import { ChangeDetectorRef, Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AlertController, LoadingController, ModalController, NavController } from '@ionic/angular';
import { pairwise, startWith } from 'rxjs';
import { PageBase } from 'src/app/page-base';
import { CommonService } from 'src/app/services/core/common.service';
import { EnvService } from 'src/app/services/core/env.service';
import { ACCOUNT_ApplicationUserProvider } from 'src/app/services/custom.service';
import { CRM_ContactProvider, HRM_StaffProvider, SYS_AccountGroupProvider } from 'src/app/services/static/services.service';

@Component({
	selector: 'app-user-detail',
	templateUrl: './user-detail.page.html',
	styleUrls: ['./user-detail.page.scss'],
	standalone: false,
})
export class UserDetailPage extends PageBase {
	roleList: any = [];
	passwordViewType = 'password';
	groupList: [];
	constructor(
		public pageProvider: ACCOUNT_ApplicationUserProvider,

		public contactProvider: CRM_ContactProvider,
		public staffProvider: HRM_StaffProvider,
		public accountGroup: SYS_AccountGroupProvider,
		public env: EnvService,
		public navCtrl: NavController,
		public modalController: ModalController,
		public route: ActivatedRoute,
		public alertCtrl: AlertController,
		public formBuilder: FormBuilder,
		public cdr: ChangeDetectorRef,
		public loadingController: LoadingController,
		public commonService: CommonService
	) {
		super();
		this.pageConfig.isDetailPage = true;

		this.formGroup = formBuilder.group({
			Id: [''],
			Email: ['', [Validators.required, Validators.email]],
			UserName: ['', [Validators.required, Validators.pattern('^[a-zA-Z0-9._\\-@]+$')]],
			PhoneNumber: [''],
			Fullname: [''],
			Password: [''],
			ConfirmPassword: [''],
			SysRoles: [[], Validators.required],
			Avatar: ['Uploads/HRM/Staffs/Avatars/' + this.item?.Id + '.jpg'],
			IDBusinessPartner: [''],
			StaffID: [''],
			GroupIds: [[]],
		});
		this.formGroup.valueChanges.subscribe((change) => {
			if (change.Password && change.Password != change.ConfirmPassword) {
				this.formGroup.get('ConfirmPassword').setErrors({ isError: true });
			} else {
				this.formGroup.get('ConfirmPassword').setErrors(null);
			}
		});
	}
	passwordMatchValidator(): ValidatorFn {
		return (formGroup: FormControl): { [key: string]: any } | null => {
			const password = formGroup.get('Password')?.value;
			const confirmPassword = formGroup.get('ConfirmPassword')?.value;

			if (password !== confirmPassword) {
				return { passwordMismatch: true };
			}
			return null;
		};
	}
	_staffDataSource = this.buildSelectDataSource((term) => {
		return this.staffProvider.search({
			SortBy: ['Id_desc'],
			Take: 20,
			Skip: 0,
			Term: term,
		});
	});
	_businessPartnerDataSource = this.buildSelectDataSource((term) => {
		let that = this;
		return this.contactProvider.search({
			SortBy: ['Id_desc'],
			Take: 20,
			Skip: 0,
			Term: term,
			SkipMCP: true,
			SkipAddress: true,
			IsVendor: that.formGroup.get('SysRoles')?.value.includes('VENDOR') ? true : undefined,
			IsStorer: that.formGroup.get('SysRoles')?.value.includes('STORER') ? true : undefined,
			IsCustomer: that.formGroup.get('SysRoles')?.value.includes('CUSTOMER') ? true : undefined,
			IsBranch: false,
		});
	});
	preLoadData(event?: any): void {
		Promise.all([this.pageProvider.commonService.connect('GET', 'Account/GetRoles', null).toPromise(), this.accountGroup.read()]).then((values: any) => {
			if (values && values[0]) {
				this.roleList = values[0];
			}
			if (values[1] && values[1].data) {
				this.groupList = values[1].data;
			}
			super.preLoadData(event);
		});
	}

	loadData() {
		if (this.id) {
			this.pageProvider
				.getAnItem(this.id, null)
				.then((ite) => {
					this.item = ite;
					this.loadedData(event);
				})
				.catch((err) => {
					console.log(err);

					if ((err.status = 404)) {
						this.nav('not-found', 'back');
					} else {
						this.item = null;
						this.loadedData(event);
					}
				});
		} else if (this.id == 0) {
			if (!this.item) this.item = {};

			Object.assign(this.item, this.DefaultItem);
			this.loadedData(event);
		} else {
			this.loadedData(event);
		}
	}
	loadedData(event?: any, ignoredFromGroup?: boolean): void {
		super.loadedData();
		if (this.item.Roles) {
			this.formGroup.get('SysRoles').setValue(this.item.Roles.map((r) => r.RoleId));
		}
		if (this.item._Staff?.Id) {
			this._staffDataSource.selected.push(this.item._Staff);
		}
		if (this.item._BusinessPartner?.Id) {
			this._businessPartnerDataSource.selected.push(this.item._BusinessPartner);
		}
		Promise.all([
			this.contactProvider.read({
				Take: 20,
				SkipMCP: true,
				SkipAddress: true,
				IsVendor: this.formGroup.get('SysRoles')?.value.includes('VENDOR') ? true : undefined,
				IsStorer: this.formGroup.get('SysRoles')?.value.includes('STORER') ? true : undefined,
				IsCustomer: this.formGroup.get('SysRoles')?.value.includes('CUSTOMER') ? true : undefined,
				IsBranch: false,
			}),
			this.staffProvider.read({ Take: 20 }),
		]).then((values: any) => {
			if (values) {
				if (values[0] && values[0].data?.length > 0) {
					this._businessPartnerDataSource.selected = [...this._businessPartnerDataSource.selected, ...values[0].data];
				}
				if (values[1] && values[1].data?.length > 0) {
					this._staffDataSource.selected = [...this._staffDataSource.selected, ...values[1].data];
				}
			}
			this._staffDataSource.initSearch();
			this._businessPartnerDataSource.initSearch();
			this.formGroup
				.get('SysRoles')
				?.valueChanges.pipe(startWith([]), pairwise())
				.subscribe(([oldValue, currentValue]: [string[], string[]]) => {
					const detachCheckRoles = ['CUSTOMER', 'VENDOR', 'STORER'];
					const rolesRemoved = oldValue.filter((role) => detachCheckRoles.includes(role) && !currentValue.includes(role));
					const rolesAdded = currentValue.filter((role) => detachCheckRoles.includes(role) && !oldValue.includes(role));
					if (rolesRemoved.length || rolesAdded.length) {
						if (!currentValue.some((role) => detachCheckRoles.includes(role))) {
							this.formGroup.get('IDBusinessPartner')?.setValue(null);
							this.formGroup.get('IDBusinessPartner')?.setValidators([]);
						} else {
							this.formGroup.get('IDBusinessPartner')?.setValue(null);
							this.contactProvider
								.read({
									Take: 20,
									SkipMCP: true,
									SkipAddress: true,
									IsVendor: this.formGroup.get('SysRoles')?.value.includes('VENDOR') ? true : undefined,
									IsStorer: this.formGroup.get('SysRoles')?.value.includes('STORER') ? true : undefined,
									IsCustomer: this.formGroup.get('SysRoles')?.value.includes('CUSTOMER') ? true : undefined,
									IsBranch: false,
								})
								.then((result: any) => {
									if (result && result.data?.length > 0) {
										this._businessPartnerDataSource.selected = [...result.data];
										this._businessPartnerDataSource.initSearch();
									}
								});
							this.formGroup.get('IDBusinessPartner')?.setValidators([Validators.required]);
						}
						this.formGroup.get('IDBusinessPartner')?.updateValueAndValidity();
					}
					if (!currentValue.includes('STAFF')) {
						this.formGroup.get('StaffID')?.setValue(null);
						this.formGroup.get('StaffID')?.setValidators([]);
					} else {
						this.formGroup.get('StaffID')?.setValidators([Validators.required]);
					}
					this.formGroup.get('StaffID')?.updateValueAndValidity();
				});
		});
		if (this.item.Id == 0) {
			this.formGroup.get('Password').setValidators([Validators.required]);
			this.formGroup.get('Password')?.updateValueAndValidity();
		} else {
			this.formGroup.get('Password').setValidators([]);
			this.formGroup.get('Password')?.updateValueAndValidity();
		}
		if(this.item.LockoutEnabled)this.formGroup.disable();
		else this.formGroup.enable();
		 
	}

	changeEmail() {
		if (!this.formGroup.get('UserName').value) {
			this.formGroup.get('UserName').setValue(this.formGroup.get('Email').value);
			this.formGroup.get('UserName').markAsDirty();
		}
	}
	async saveChange() {
		return new Promise((resolve, reject) => {
			this.formGroup.updateValueAndValidity();
			if (!this.formGroup.valid) {
				let invalidControls = this.findInvalidControlsRecursive(this.formGroup);
				const translationPromises = invalidControls.map((control) => this.env.translateResource(control));
				Promise.all(translationPromises).then((values) => {
					let invalidControls = values;
					this.env.showMessage('Please recheck control(s): {{value}}', 'warning', invalidControls.join(' | '));
					reject('form invalid');
				});
			} else if (this.submitAttempt == false) {
				this.submitAttempt = true;
				let submitItem = this.formGroup.getRawValue(); //this.getDirtyValues(this.formGroup);

				this.pageProvider
					.save(submitItem, this.pageConfig.isForceCreate)
					.then((savedItem: any) => {
						resolve(savedItem);
						if (this.formGroup.get('Id').value != 0 && this.formGroup.get('Password').value) {
							let obj = this.formGroup.getRawValue();
							this.pageProvider
								.resetPassword(obj.Id, obj.Password, obj.ConfirmPassword)
								.then((savedItem: any) => {
									this.env.showMessage('Password changed', 'success');
									this.cdr.detectChanges();
									this.formGroup.markAsPristine();
								})
								.catch((err) => {
									if (err._body?.indexOf('confirmation password do not match') > -1) {
										this.env.showMessage('log-in password does not match', 'danger');
									} else if (err._body?.indexOf('least 6 characters') > -1) {
										this.env.showMessage('Password must contain more than 6 characters', 'danger');
									} else {
										this.env.showMessage('Cannot save, please try again', 'danger');
									}
								});
						}
						this.savedChange(savedItem, this.formGroup);
					})
					.catch((err) => {
						if (err.error?.ExceptionMessage) this.env.showMessage(err.error?.ExceptionMessage || 'Cannot save, please try again', 'danger');
						else this.env.showMessage(err.error?.Message || 'Cannot save, please try again', 'danger');
						this.cdr.detectChanges();
						this.submitAttempt = false;
						reject(err);
					});
			} else {
				reject('submitAttempt');
			}
		});
	}

	savedChange(savedItem = null, form = this.formGroup) {
		if (savedItem) {
			if (form.controls.Id && savedItem.Id && form.controls.Id.value != savedItem) form.controls.Id.setValue(savedItem?.Id || savedItem);

			if (this.pageConfig.isDetailPage && form == this.formGroup && this.id == 0) {
				this.item.Id = savedItem?.Id || savedItem;
				this.id = savedItem?.Id || savedItem;
				if (window.location.hash.endsWith('/0')) {
					let newURL = window.location.hash.substring(0, window.location.hash.length - 1) + (savedItem?.Id || savedItem);
					history.pushState({}, null, newURL);
				}
			}
		}
		this.formGroup.get('Password').setValue('');
		this.formGroup.get('ConfirmPassword').setValue('');
		this.loadedData();
		this.env.showMessage('Saving completed!', 'success');
	}
	segmentView = 's1';

	displayMappingSelectBox(type) {
		if (type == 'BUSINESSPARTNER') {
			return this.formGroup.get('SysRoles')?.value?.some((d) => ['VENDOR', 'CUSTOMER', 'STORER'].includes(d));
		} else {
			return this.formGroup.get('SysRoles')?.value?.some((d) => d == type);
		}
	}

	lockAccount() {
		if (!this.item.LockoutEnabled) {
			this.env
				.showLoading('Please wait for a few moments', this.pageProvider.commonService.connect('PUT', 'Account/DisableAccount/' + this.item.Id, null).toPromise())
				.then((res) => {
					this.env.showMessage('Locked', 'success');
					this.refresh();
				})
				.catch((err) => {
					console.log(err);
					this.env.showMessage(err, 'danger');
				});
		} else {
			this.env
				.showLoading('Please wait for a few moments', this.pageProvider.commonService.connect('PUT', 'Account/EnableAccount/' + this.item.Id, null).toPromise())
				.then((res) => {
					this.env.showMessage('Unlocked', 'success');
					this.refresh();
				})
				.catch((err) => {
					console.log(err);
					this.env.showMessage(err, 'danger');
				});
		}
	}
}
