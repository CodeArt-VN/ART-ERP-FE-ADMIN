import { Component } from '@angular/core';
import { NavController, ModalController, AlertController, LoadingController, PopoverController } from '@ionic/angular';
import { EnvService } from 'src/app/services/core/env.service';
import { PageBase } from 'src/app/page-base';
import { BRA_BranchProvider, SYS_AccountGroupProvider, SYS_TranslateProvider } from 'src/app/services/static/services.service';
import { Location } from '@angular/common';
import { environment } from 'src/environments/environment';
import { ACCOUNT_ApplicationUserProvider } from 'src/app/services/custom/custom.service';
import { ApiSetting } from 'src/app/services/static/api-setting';
import { APIList } from 'src/app/services/static/global-variable';

@Component({
	selector: 'app-user',
	templateUrl: 'user.page.html',
	styleUrls: ['user.page.scss'],
	standalone: false,
})
export class UserPage extends PageBase {
	roleList: any = [];
	groupList: any = [];
	constructor(
		public pageProvider: ACCOUNT_ApplicationUserProvider,
		public branchProvider: BRA_BranchProvider,
		public accountGroup: SYS_AccountGroupProvider,
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

	loadedData(event) {
		this.items.forEach((i) => {
			i.Avatar = environment.staffAvatarsServer + i.Code + '.jpg';
		});
		super.loadedData(event);
	}
	archiveItems(publishEventCode = this.pageConfig.pageName) {
		if (this.pageConfig.canArchive) {
			if (this.query.IsDisabled) {
				this.pageProvider.commonService
					.connect('PUT', 'Account/EnableAccount/' + this.selectedItems.map((s) => s.Id).join(','), null)
					.toPromise()
					.then(() => {
						this.env.showMessage('Reopened {{value}} lines!', 'success', this.selectedItems.length);
					});
			} else {
				this.pageProvider.commonService
					.connect('PUT', 'Account/DisableAccount/' + this.selectedItems.map((s) => s.Id).join(','), null)
					.toPromise()
					.then(() => {
						this.env.showMessage('Archived {{value}} lines!', 'success', this.selectedItems.length);
					});
			}
			this.removeSelectedItems();
		}
	}
	delete(publishEventCode = this.pageConfig.pageName) {
		if (this.pageConfig.canDelete) {
			this.env
				.showPrompt(
					{
						code: 'You can not undo this action.',
						value: this.selectedItems.length,
					},
					null,
					{ code: 'Are you sure you want to delete the {{value}} selected item(s)?', value: this.selectedItems.length }
				)
				.then((_) => {
					this.env
						.showLoading(
							'Please wait for a few moments',
							this.pageProvider.commonService.connect('PUT', 'Account/DeleteAccount/' + this.selectedItems.map((s) => s.Id).join(','), null).toPromise()
						)
						.then((_) => {
							this.removeSelectedItems();
							this.env.showMessage('Deleted!', 'success');
							this.env.publishEvent({ Code: publishEventCode });
						})
						.catch((err) => {
							this.env.showMessage('DELETE_RESULT_FAIL', 'danger');
							console.log(err);
						});
				});
		}
	}
	async export(): Promise<void> {
		if (this.submitAttempt) return;
		this.submitAttempt = true;
		this.env
			.showLoading('Please wait for a few moments', this.pageProvider.commonService.connect('DOWNLOAD', 'ACCOUNT/ApplicationUsers/Export', this.query).toPromise())
			.then((response: any) => {
				this.downloadURLContent(response);
				this.submitAttempt = false;
			})
			.catch((err) => {
				this.submitAttempt = false;
			});
	}
	async import(event) {
		if (event.target.files.length == 0) return;
		let apiPath = {
			postImport: {
				method: 'UPLOAD',
				url: function () {
					return 'ACCOUNT/ApplicationUsers/Import';
				},
			},
		};
		this.env
			.showLoading('Please wait for a few moments', this.pageProvider.commonService.import(apiPath, event.target.files[0]))
			.then((resp: any) => {
				this.refresh();
				if (resp.ErrorList && resp.ErrorList.length) {
					let message = '';
					for (let i = 0; i < resp.ErrorList.length && i <= 5; i++)
						if (i == 5) message += '<br> Còn nữa...';
						else {
							const e = resp.ErrorList[i];
							message += '<br> ' + e.Id + '. Tại dòng ' + e.Line + ': ' + e.Message;
						}
					this.env
						.showPrompt(
							{
								code: 'Có {{value}} lỗi khi import: {{value1}}',
								value: resp.ErrorList.length,
								value1: message,
							},
							'Bạn có muốn xem lại các mục bị lỗi?',
							'Có lỗi import dữ liệu'
						)
						.then((_) => {
							this.downloadURLContent(resp.FileUrl);
						})
						.catch((e) => {});
				} else {
					this.env.showMessage('Import completed!', 'success');
				}
			})
			.catch((err) => {
				if (err.statusText == 'Conflict') {
					this.downloadURLContent(err._body);
				}
			});
	}

	lockAccount(i) {
		if (!i.LockoutEnabled) {
			this.env
				.showLoading('Please wait for a few moments', this.pageProvider.commonService.connect('PUT', 'Account/DisableAccount/' + i.Id, null).toPromise())
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
				.showLoading('Please wait for a few moments', this.pageProvider.commonService.connect('PUT', 'Account/EnableAccount/' + i.Id, null).toPromise())
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
