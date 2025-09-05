import { catchError, distinctUntilChanged, map, merge, switchMap, tap } from 'rxjs/operators';
import { from, of, Subject } from 'rxjs';
import { Component, ChangeDetectorRef, ViewChild } from '@angular/core';
import { NavController, ModalController, LoadingController, AlertController } from '@ionic/angular';
import { PageBase } from 'src/app/page-base';
import { ActivatedRoute } from '@angular/router';
import { EnvService } from 'src/app/services/core/env.service';
import { BRA_BranchProvider, CRM_ContactProvider, SYS_AccountGroupProvider, SYS_BranchInGroupProvider, SYS_UserInGroupProvider } from 'src/app/services/static/services.service';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { CommonService } from 'src/app/services/core/common.service';
import { ACCOUNT_ApplicationUserProvider } from 'src/app/services/custom/custom.service';
import { environment } from 'src/environments/environment';

@Component({
	selector: 'app-user-group-detail',
	templateUrl: './user-group-detail.page.html',
	styleUrls: ['./user-group-detail.page.scss'],
	standalone: false,
})
export class UserGroupDetailPage extends PageBase {
	@ViewChild('popoverTitlePosition') popoverTitlePosition;

	roleDataSource: any;
	titlePositions: any;
	formGroupTitle: FormGroup<any>;
	isPopoverTitlePositionOpen = false;
	isOpenTitlePosition = false;
	roleSelected: string;
	constructor(
		public pageProvider: SYS_AccountGroupProvider,
		public branchInGroupProvider: SYS_BranchInGroupProvider,
		public accountUserProvider: ACCOUNT_ApplicationUserProvider,
		public userInGroupProvider: SYS_UserInGroupProvider,
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
		public commonService: CommonService
	) {
		super();
		this.pageConfig.isDetailPage = true;
		this.formGroup = formBuilder.group({
			IDBranch: [''],
			Id: new FormControl({ value: '', disabled: true }),
			Name: ['', Validators.required],
			Code: ['', Validators.required],
			Type: ['', Validators.required],
			Remark: [''],
			IDUser: [''],
			IsDisabled: new FormControl({ value: '', disabled: true }),
			IsDeleted: new FormControl({ value: '', disabled: true }),
			CreatedBy: new FormControl({ value: '', disabled: true }),
			CreatedDate: new FormControl({ value: '', disabled: true }),
			ModifiedBy: new FormControl({ value: '', disabled: true }),
			ModifiedDate: new FormControl({ value: '', disabled: true }),
		});
	}

	preLoadData(event?: any): void {
		Promise.all([
			this.accountUserProvider.commonService.connect('GET', 'Account/GetRoles', null).toPromise(),
			this.branchProvider.read({
				Take: 5000,
				AllChildren: true,
				AllParent: true,
				Type: 'TitlePosition',
			}),
		]).then((values) => {
			this.roleDataSource = values[0];
			let dataTitlePosition = values[1]['data'];
			dataTitlePosition.forEach((i) => {
				i.disabled = i.Type != 'TitlePosition';
			});
			this.buildFlatTree(dataTitlePosition, this.titlePositions, false).then((resp: any) => {
				this.titlePositions = resp;
			});
			super.preLoadData(null);
		});
		this.formGroupTitle = this.formBuilder.group({
			IDBranch: [''],
			Id: new FormControl({ value: '', disabled: true }),
			Name: [''],
			IDAccountGroup: [''],
		});
	}

	loadAnItem(event = null) {
		this.id = typeof this.id == 'string' ? parseInt(this.id) : this.id;

		if (this.id) {
			this.pageProvider.commonService
				.connect('GET', 'SYS/AccountGroup/GetAnItem', { Id: this.id })
				.toPromise()
				.then((ite: any) => {
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
		super.loadedData(event, ignoredFromGroup);
		if (!this.item.TitlePosition) {
			this.item.TitlePosition = [];
		}
		if (!this.item.UserAccount) {
			this.item.UserAccount = [];
		} else {
			this.item.UserAccount.forEach((i) => {
				i.Avatar = environment.staffAvatarsServer + i.Code + '.jpg';
				i.isAdd = false;
			});
		}
		if (this.item?.Type && this.item?.Type == 'STAFF') {
			this.isOpenTitlePosition = true;
		} else {
			this.isOpenTitlePosition = false;
		}
		if (this.item.TitlePosition.length > 0 || !this.pageConfig.canEdit) {
			this.formGroup.get('Type').disable();
		} else {
			this.formGroup.get('Type').enable();
		}
		this.roleSelected = this.formGroup.get('Type').value;
	}

	changeType(e) {
		if (e.Name == 'STAFF') {
			this.isOpenTitlePosition = true;
		} else {
			this.isOpenTitlePosition = false;
		}
		this.roleSelected = e.Name;
		this.formGroup.controls.Type.setValue(e.Name);
		this.formGroup.controls.Type.markAsDirty();
		this.saveChange();
	}

	presentPopoverTitlePosition(e: Event, fg = null) {
		this.formGroupTitle = this.formBuilder.group({
			IDBranch: [fg?.IDBranch],
			Id: [fg?.Id ?? 0],
			Name: [fg?.Name ?? ''],
			IDAccountGroup: [fg?.IDAccountGroup ?? ''],
		});
		this.popoverTitlePosition.event = e;
		this.isPopoverTitlePositionOpen = true;
	}

	onTitlePositionChange() {
		const id = this.formGroupTitle.get('Id')?.value ?? 0;
		const idBranch = this.formGroupTitle.get('IDBranch')?.value;
		const name = this.titlePositions.find((p) => p.Id == idBranch)?.Name;
		if (this.submitAttempt == false && idBranch != null && idBranch != '') {
			this.submitAttempt = true;
			let submitItem = {
				IDBranch: idBranch,
				IDAccountGroup: this.item.Id,
				Id: id,
			};
			this.branchInGroupProvider
				.save(submitItem)
				.then((resp: any) => {
					if (!id) {
						let item = {
							Id: resp.Id,
							Name: name,
							IDAccountGroup: resp.IDAccountGroup,
							IDBranch: resp.IDBranch,
						};
						this.item.TitlePosition.push(item);
					} else {
						let item = this.item.TitlePosition.find((i) => i.Id == id);
						if (item) {
							item.Name = name;
							item.IDBranch = idBranch;
						}
					}
					if (this.item.TitlePosition.length > 0) {
						this.formGroup.get('Type').disable();
					} else {
						this.formGroup.get('Type').enable();
					}
					this.formGroupTitle.markAsPristine();
					this.cdr.detectChanges();
					this.env.showMessage('Saving completed!', 'success');
					this.submitAttempt = false;
					this.isPopoverTitlePositionOpen = false;
				})
				.catch((err) => {
					this.env.showMessage('Cannot save, please try again', 'danger');
					this.submitAttempt = false;
					this.isPopoverTitlePositionOpen = false;
				});
		}
	}

	removeTitlePosition(item) {
		let groups = this.item.TitlePosition;
		let index = groups.findIndex((i) => i == item);
		this.env.showPrompt('Bạn có chắc muốn xóa ?', null, 'Xóa 1 dòng').then((_) => {
			this.branchInGroupProvider.delete(item).then((result) => {
				groups.splice(index, 1);
				if (groups.length > 0) {
					this.formGroup.get('Type').disable();
				} else {
					this.formGroup.get('Type').enable();
				}
			});
		});
	}

	addUserAccount(): void {
		let newUser: any = {
			Id: 0,
			IDAccountGroup: this.item.Id,
			Avatar: environment.staffAvatarsServer + '.jpg',
			IDUser: null,
			_User: {
				FullName: '',
				UserName: '',
			},
			isAdd: true,
		};

		let existedUsers = this.item.UserAccount.map((user) => user.IDUser);
		let searchInput$ = new Subject<string>();
		let group = this.formBuilder.group({
			Id: new FormControl({ value: newUser.Id, disabled: true }),
			_UserSearchLoading: [false],
			existedUsers: [existedUsers],
			_UserSearchInput: [searchInput$],
			_UserDataSource: [
				of([]).pipe(
					merge(
						searchInput$.pipe(
							distinctUntilChanged(),
							tap(() => group.controls._UserSearchLoading.setValue(true)),
							switchMap((term) => {
								return from(
									this.accountUserProvider.read({
										SortBy: ['Id_desc'],
										Take: 20,
										Skip: 0,
										Keyword: term,
										Role: this.roleSelected,
										Id_ne: group.controls.existedUsers.value.length > 0 ? group.controls.existedUsers.value : [],
									})
								).pipe(
									map((items) => items['data']),
									catchError(() => of([])),
									tap(() => group.controls._UserSearchLoading.setValue(false))
								);
							})
						)
					)
				),
			],
			Avatar: [newUser.Avatar],
			IDAccountGroup: [newUser.IDAccountGroup],
			IDUser: [newUser.IDUser],
		});
		newUser._formGroup = group;
		this.item.UserAccount.push(newUser);
	}

	closeAddUserAccount(row) {
		row.isAdd = false;
		if (row.Id === 0) {
			this.item.UserAccount = this.item.UserAccount.filter((e) => e.Id !== 0);
		} else {
			row.isAdd = false;
		}
	}

	changeUserAccount(e, fg) {
		if (this.submitAttempt == false) {
			this.submitAttempt = true;
			let user = {
				IDAccountGroup: this.item.Id,
				IDUser: e.Id,
				Id: fg.controls.Id.value ?? 0,
				_User: {
					FullName: e.FullName,
					UserName: e.UserName,
				},
				Avatar: environment.staffAvatarsServer + e.Code + '.jpg',
			};
			this.userInGroupProvider
				.save(user)
				.then((resp: any) => {
					if (!user.Id) {
						this.closeAddUserAccount(user);
						resp._User = user._User;
						(resp.Avatar = user.Avatar), this.item.UserAccount.push(resp);
					}
					this.env.publishEvent({ Code: 'account-group' });
					this.env.showMessage('Saving completed!', 'success');
					this.submitAttempt = false;
				})
				.catch((err) => {
					this.env.showMessage('Cannot save, please try again', 'danger');
					this.submitAttempt = false;
				});
		}
	}

	removeUserAccount(item) {
		let groups = this.item.UserAccount;
		let index = groups.findIndex((i) => i == item);
		this.env.showPrompt('Bạn có chắc muốn xóa ?', null, 'Xóa 1 dòng').then((_) => {
			this.userInGroupProvider.delete(item).then((result) => {
				groups.splice(index, 1);
				this.env.publishEvent({ Code: 'account-group' });
				if (groups.length > 0) {
					this.formGroup.get('Type').disable();
				} else {
					this.formGroup.get('Type').enable();
				}
			});
		});
	}

	async saveChange() {
		super.saveChange2();
	}

	savedChange(savedItem = null, form = this.formGroup) {
		super.savedChange(savedItem, form);
		this.item = savedItem;
		this.loadedData();
	}
}
