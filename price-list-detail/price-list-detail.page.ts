import { Component, ChangeDetectorRef, ViewChild } from '@angular/core';
import { NavController, LoadingController, AlertController, PopoverController } from '@ionic/angular';
import { PageBase } from 'src/app/page-base';
import { ActivatedRoute } from '@angular/router';
import { EnvService } from 'src/app/services/core/env.service';
import {
	CRM_BusinessPartnerGroupProvider,
	CRM_ContactProvider,
	SYS_CurrencyProvider,
	WMS_PriceListDetailProvider,
	WMS_PriceListProvider,
	WMS_PriceListVersionProvider,
	WMS_PriceListVersionDetailProvider,
} from 'src/app/services/static/services.service';
import { FormBuilder, Validators, FormControl, FormArray } from '@angular/forms';
import { CommonService } from 'src/app/services/core/common.service';
import { NgSelectConfig } from '@ng-select/ng-select';
import { ApiSetting } from 'src/app/services/static/api-setting';
import { lib } from 'src/app/services/static/global-functions';

@Component({
	selector: 'app-price-list-detail',
	templateUrl: './price-list-detail.page.html',
	styleUrls: ['./price-list-detail.page.scss'],
	standalone: false,
})
export class PriceListDetailPage extends PageBase {
	@ViewChild('importfile') importfile: any;

	constructor(
		public pageProvider: WMS_PriceListProvider,
		public priceListDetailProvider: WMS_PriceListDetailProvider,
		public businessPartnerProvider: CRM_ContactProvider,
		public businessPartnerGroupProvider: CRM_BusinessPartnerGroupProvider,
		public currencyProvider: SYS_CurrencyProvider,
		public priceListVersion: WMS_PriceListVersionProvider,
		public priceListVersionDetail: WMS_PriceListVersionDetailProvider,

		public popoverCtrl: PopoverController,
		public env: EnvService,
		public navCtrl: NavController,
		public route: ActivatedRoute,
		public alertCtrl: AlertController,
		public formBuilder: FormBuilder,
		public cdr: ChangeDetectorRef,
		public loadingController: LoadingController,
		public commonService: CommonService,
		private config: NgSelectConfig
	) {
		super();
		this.pageConfig.isDetailPage = true;
		this.id = this.route.snapshot.paramMap.get('id');
		this.config.notFoundText = 'Không tìm thấy dữ liệu phù hợp...';
		this.config.clearAllText = 'Xóa hết';

		this.formGroup = formBuilder.group({
			IDBranch: new FormControl({ value: null, disabled: false }),
			IDBasePriceList: [''],

			PrimaryDefaultCurrency: ['', Validators.required],
			PrimaryDefaultCurrency1: [''],
			PrimaryDefaultCurrency2: [''],

			Code: [{ value: '' }],
			Name: ['', Validators.required],
			Remark: [''],
			Sort: [''],
			IsDisabled: new FormControl({ value: '', disabled: true }),
			IsPriceListForVendor: [''],
			IsTaxIncluded: [''],

			Factor: [1, Validators.required],
			RoundingMethod: [-1],
			ValidFrom: [''],
			ValidTo: [''],

			Id: new FormControl({ value: 0, disabled: true }),
			IsDeleted: new FormControl({ value: '', disabled: true }),
			CreatedBy: new FormControl({ value: '', disabled: true }),
			CreatedDate: new FormControl({ value: '', disabled: true }),
			ModifiedBy: new FormControl({ value: '', disabled: true }),
			ModifiedDate: new FormControl({ value: '', disabled: true }),
			Versions: this.formBuilder.array([]),
		});

		Object.assign(pageProvider, {
			importPriceList(fileToUpload: File, id) {
				const formData: FormData = new FormData();
				formData.append('fileKey', fileToUpload, fileToUpload.name);
				return new Promise((resolve, reject) => {
					this.commonService
						.connect('UPLOAD', ApiSetting.apiDomain('WMS/PriceList/ImportPriceList/' + id), formData)
						.toPromise()
						.then((data) => {
							resolve(data);
						})
						.catch((err) => {
							reject(err);
						});
				});
			},
		});
	}

	basePriceList = [];
	currencyList = [];
	roundingMethodList = [
		{ Id: -1, Name: 'Không làm tròn' },
		{ Id: 0, Name: '0 số thập phân' },
		{ Id: 1, Name: '1 số thập phân' },
		{ Id: 2, Name: '2 số thập phân' },
		{ Id: 3, Name: '3 số thập phân' },
		{ Id: 4, Name: '4 số thập phân' },
	];

	preLoadData(event) {
		this.pageProvider.read().then((resp) => {
			this.basePriceList = resp['data'].filter((d) => d.Id != this.id);
			super.preLoadData(event);
		});
		this.currencyProvider.read().then((resp) => {
			this.currencyList = resp['data'];
		});
		this.itemsQuery.IDPriceList = this.id;
	}

	loadedData(event) {
		super.loadedData(event);
		this.loadItemsPrice();
		this.loadPartnerGroups();
		this.loadPartners();
		this.setVersions();
	}

	calcPriceListVersion(id) {
		this.env
			.showLoading('Please wait for a few moments', this.pageProvider.commonService.connect('POST', 'WMS/PriceList/CalculatePriceListVersionDetail', {Id : parseInt(id)}).toPromise())
			.then((resp) => {
				if(resp)this.env.showMessage('Calculation completed', 'success');
				else this.env.showMessage('Calculation failed', 'danger');
			});
	}

	setVersions() {
		this.formGroup.controls.Versions = new FormArray([]);
		if (this.item.Versions?.length)
			this.item.Versions.forEach((i) => {
				this.addVersion(i);
			});
		// else
		//     this.addVersion({ IDOrder: this.item.Id, Id: 0 });
	}

	addVersion(line) {
		let groups = <FormArray>this.formGroup.controls.Versions;
		let group = this.formBuilder.group({
			IDPriceList: [line.IDPriceList ? line.IDPriceList : 0],
			Name: [line.Name, Validators.required],
			Id: [line.Id ? line.Id : 0],
			ValidFrom: [line.ValidFrom],
			ValidTo: [line.ValidTo],
			IsDisabled: new FormControl({
				value: line.IsDisabled,
				disabled: true,
			}),
			AppliedDate: new FormControl({
				value: lib.dateFormat(line.AppliedDate, 'dd/mm/yy hh:MM', 'Chưa áp dụng'),
				disabled: true,
			}),
			_checked: [false],
		});

		if (!this.pageConfig.canEdit) {
			group.controls['_checked'].disable();
			group.controls['Name'].disable();
		} else {
			group.controls['_checked'].enable();
			group.controls['Name'].enable();
		}

		if (line.AppliedDate) {
			groups.push(group);
		} else {
			groups.insert(0, group);
		}
	}

	removeVersion(index) {
		this.alertCtrl
			.create({
				header: 'Xóa phiên bản này',
				//subHeader: '---',
				message: 'Bạn có chắc muốn xóa phiên bản giá này?',
				buttons: [
					{
						text: 'Không',
						role: 'cancel',
					},
					{
						text: 'Đồng ý xóa',
						cssClass: 'danger-btn',
						handler: () => {
							let groups = <FormArray>this.formGroup.controls.Versions;
							let Ids = [];
							Ids.push({
								Id: groups.controls[index]['controls'].Id.value,
							});
							this.priceListVersion.delete(Ids).then((resp) => {
								groups.removeAt(index);
								this.env.publishEvent({
									Code: this.pageConfig.pageName,
								});
								this.env.showMessage('Deleted!', 'success');
							});
						},
					},
				],
			})
			.then((alert) => {
				alert.present();
			});
	}

	segmentView = {
		Page: 's4',
		ShowSpinner: true,
	};

	itemList = [];
	itemsQuery: any = {
		IDPriceList: 0,
		IsManual: 'true',
		SortBy: '[Id_desc]',
		Keyword: '',
	};
	loadItemsPrice() {
		this.itemList = [];
		this.segmentView.ShowSpinner = true;
		if (!this.itemsQuery.IsManual) {
			this.itemsQuery.IsManual = '';
		}
		let apiPath = {
			method: 'GET',
			url: function () {
				return ApiSetting.apiDomain('WMS/Item/ItemPrice');
			},
		};
		this.pageProvider.commonService
			.connect(apiPath.method, apiPath.url(), this.itemsQuery)
			.toPromise()
			.then((data: any) => {
				data.forEach((i) => {
					i.UoMs.forEach((u) => {
						if (!u.Price) {
							u.Price = {
								Id: 0,
								IsManual: false,
								Price: 0,
								Price1: 0,
								Price2: 0,
							};
						}
						u.Price.IDPriceList = this.item.Id;
						u.Price.IDItem = i.Id;
						u.Price.IDItemUoM = u.Id;
					});
				});
				this.itemList = data;
				this.segmentView.ShowSpinner = false;
			});
	}

	businessPartnerGroupList = [];
	loadPartnerGroups() {
		this.businessPartnerGroupProvider.read({ IDPriceList: this.id }).then((resp) => {
			this.businessPartnerGroupList = resp['data'];
		});
	}

	businessPartnerList = [];
	loadPartners() {
		this.businessPartnerProvider.read({ IDPriceList: this.id }).then((resp) => {
			this.businessPartnerList = resp['data'];
		});
	}

	changeManualPrice(p) {
		if (!this.pageConfig.canEdit) {
			return;
		}
		p.IsManual = !p.IsManual;
		this.savePriceDetail(p);
	}

	savePriceDetail(p) {
		let apiPath = {
			method: 'POST',
			url: function (id) {
				return ApiSetting.apiDomain('WMS/PriceListDetail/CalcPrice/' + id);
			},
		};
		this.priceListDetailProvider.commonService
			.connect(apiPath.method, apiPath.url(p.Id), p)
			.toPromise()
			.then((resp: any) => {
				p.Id = resp['Id'];
				p.Price = resp['Price'];
				p.Price1 = resp['Price1'];
				p.Price2 = resp['Price2'];

				this.env.showMessage('Changes saved', 'success');
			});
	}

	reCalcPrice() {
		let apiPath = {
			method: 'POST',
			url: function () {
				return ApiSetting.apiDomain('WMS/PriceList/ReCalcPrice');
			},
		};
		this.pageProvider.commonService
			.connect(apiPath.method, apiPath.url(), this.item)
			.toPromise()
			.then((data: any) => {
				this.env.showMessage('Changes saved', 'success');
				this.loadItemsPrice();
			});
	}

	segmentChanged(ev: any) {
		this.segmentView.Page = ev.detail.value;
	}

	async saveChange() {
		//if (this.formGroup.controls.OrderLines.valid)
		super.saveChange2();
	}

	savedChange(savedItem = null, form = this.formGroup) {
		super.savedChange(savedItem, form);
		this.item = savedItem;
		this.loadedData(null);
	}

	importId = 0;
	importClick(id) {
		this.importId = id;
		this.importfile.nativeElement.value = '';
		this.importfile.nativeElement.click();
	}

	async uploadPrice(event) {
		if (event.target.files.length == 0 || this.importId == 0) return;

		const loading = await this.loadingController.create({
			cssClass: 'my-custom-class',
			message: 'Please wait for a few moments',
		});
		await loading.present().then(() => {
			this.pageProvider['importPriceList'](event.target.files[0], this.importId)
				.then((resp: any) => {
					this.refresh();
					if (loading) loading.dismiss();

					if (resp.ErrorList && resp.ErrorList.length) {
						let message = '';
						for (let i = 0; i < resp.ErrorList.length && i <= 5; i++)
							if (i == 5) message += '<br> Còn nữa...';
							else {
								const e = resp.ErrorList[i];
								message += '<br> ' + e.Id + '. Tại dòng ' + e.Line + ': ' + e.Message;
							}

						this.alertCtrl
							.create({
								header: 'Có lỗi import dữ liệu',
								subHeader: 'Bạn có muốn xem lại các mục bị lỗi?',
								message: 'Có ' + resp.ErrorList.length + ' lỗi khi import:' + message,
								cssClass: 'alert-text-left',
								buttons: [
									{
										text: 'Không',
										role: 'cancel',
										handler: () => {},
									},
									{
										text: 'Có',
										cssClass: 'success-btn',
										handler: () => {
											this.downloadURLContent(resp.FileUrl);
										},
									},
								],
							})
							.then((alert) => {
								alert.present();
							});
					} else {
						this.env.showMessage('Import completed!', 'success');
						this.env.publishEvent({
							Code: this.pageConfig.pageName,
						});
					}
				})
				.catch((err) => {
					if (err.statusText == 'Conflict') {
						this.downloadURLContent(err._body);
					}
					if (loading) loading.dismiss();
				});
		});
	}

	async exportPriceListVersion(id) {
		if (this.submitAttempt) return;
		this.submitAttempt = true;

		const loading = await this.loadingController.create({
			cssClass: 'my-custom-class',
			message: 'Vui lòng chờ export dữ liệu',
		});
		await loading.present().then(() => {
			this.priceListVersionDetail
				.export({ IDPriceListVersion: id, IsDisabled: 'skipped'})
				.then((response: any) => {
					this.downloadURLContent(response);
					if (loading) loading.dismiss();
					this.submitAttempt = false;
				})
				.catch((err) => {
					this.submitAttempt = false;
				});
		});
	}

	async downloadApplingPrice() {
		if (this.submitAttempt) return;
		this.submitAttempt = true;
		const loading = await this.loadingController.create({
			cssClass: 'my-custom-class',
			message: 'Vui lòng chờ export dữ liệu',
		});
		await loading.present().then(() => {
			this.pageProvider
				.export({ Id: this.id })
				.then((response: any) => {
					this.downloadURLContent(response);
					if (loading) loading.dismiss();
					this.submitAttempt = false;
				})
				.catch((err) => {
					this.submitAttempt = false;
				});
		});
	}

	async applyPriceListVersion(id) {
		this.commonService
			.connect('POST', ApiSetting.apiDomain('WMS/PriceList/ApplyPriceListVersion/' + id), null)
			.toPromise()
			.then((data) => {
				this.savedChange(data);
			})
			.catch((err) => {});
	}

	async deletePriceDetail(p) {
		if (this.pageConfig.canEdit) {
			this.alertCtrl
				.create({
					header: 'Xóa giá',
					//subHeader: '---',
					message: 'Bạn có chắc muốn xóa giá này?',
					buttons: [
						{ text: 'Không', role: 'cancel' },
						{
							text: 'Đồng ý xóa',
							cssClass: 'danger-btn',
							handler: () => {
								this.priceListDetailProvider.delete([{ Id: p.Id }]).then((resp) => {
									p.Id = 0;
									p.Price = 0;
									p.Price1 = 0;
									p.Price2 = 0;
									p.IsManual = false;
									this.env.showMessage('Changes saved', 'success');
								});
							},
						},
					],
				})
				.then((alert) => {
					alert.present();
				});
		}
	}
}
