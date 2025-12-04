import { Component } from '@angular/core';
import { NavController, ModalController, AlertController, LoadingController, PopoverController } from '@ionic/angular';
import { EnvService } from 'src/app/services/core/env.service';
import { PageBase } from 'src/app/page-base';
import {
	AC_CaseProvider,
	BI_HRM_PayrollPerBranchProvider,
	CRM_ContactProvider,
	FINANCE_TaxDefinitionProvider,
	HRM_StaffProvider,
	SYS_ConfigOptionProvider,
	SYS_ConfigProvider,
	WMS_AllocationStrategyProvider,
	WMS_LocationProvider,
	WMS_PriceListProvider,
	WMS_PutawayStrategyProvider,
	WMS_ZoneProvider,
} from 'src/app/services/static/services.service';
import { Location } from '@angular/common';
import { environment } from 'src/environments/environment';
import { lib } from 'src/app/services/static/global-functions';
import { SYS_Config } from 'src/app/models/model-list-interface';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, catchError, concat, distinctUntilChanged, of, switchMap, tap } from 'rxjs';
import { FormBuilder, FormControl } from '@angular/forms';

@Component({
	selector: 'app-config-grid',
	templateUrl: 'config-grid.page.html',
	styleUrls: ['config-grid.page.scss'],
	standalone: false,
})
export class ConfigGridPage extends PageBase {
	itemsState = [];
	isAllRowOpened = true;
	branchList;
	//itemsState: any = [];
	caseList = [];
	columns = [];
	configOptions;
	priceList = [];
	taxDefinitionList = [];
	locationList = null;
	zoneList = null;
	putawayStrategyList = null;
	allocationStrategyList = null;
	constructor(
		public pageProvider: SYS_ConfigProvider,
		public configOptionProvider: SYS_ConfigOptionProvider,
		public priceListProvider: WMS_PriceListProvider,
		public taxDefinitionProvider: FINANCE_TaxDefinitionProvider,
		public zoneProvider: WMS_ZoneProvider,
		public locationProvider: WMS_LocationProvider,
		public putawayStrategyProvider: WMS_PutawayStrategyProvider,
		public allocationStrategyProvider: WMS_AllocationStrategyProvider,

		public staffProvider: HRM_StaffProvider,
		public contactProvider: CRM_ContactProvider,
		public formBuilder: FormBuilder,
		public modalController: ModalController,
		public popoverCtrl: PopoverController,
		public alertCtrl: AlertController,
		public loadingController: LoadingController,
		public env: EnvService,
		public navCtrl: NavController,
		public route: ActivatedRoute,
		public router: Router,
		public location: Location
	) {
		super();
	}
	preLoadData(event?: any) {
		this.env.getBranch(this.env.selectedBranch, true).then((ls) => {
			let it = this.env.branchList.find((d) => d.Id == this.env.selectedBranch);
			const parentIds: any[] = [];
            lib.findParent(this.env.branchList, it.Id, parentIds);
			const parentNodes = parentIds.reduce((acc, pid) => {
				const node = this.env.branchList.find(x => x.Id === pid);
				if (node && !acc.some(n => n.Id === node.Id)) {
					node.show = true; 
					acc.push(node);
				}
				return acc;
			}, []).reverse();
			
    		it.show = true;
			ls.unshift(...parentNodes, it);
			this.itemsState = lib.cloneObject(ls);
		});
		// this.query.Code_in = 'BPCreditLimit';
		this.route.queryParams.subscribe((params) => {
			this.query.Code_in = this.router.getCurrentNavigation().extras.state;
		});
		Promise.all([this.priceListProvider.read(), this.taxDefinitionProvider.read()]).then((result) => {
			this.priceList = result[0]['data'];
			this.taxDefinitionList = result[1]['data'];
			super.preLoadData(event);
		});
	}

	async loadedData(event?: any, ignoredFromGroup?: boolean) {
		super.loadedData(event, ignoredFromGroup);
		if (this.query.Code_in) {
			this.env.showLoading('Please wait for a few moments', this.configOptionProvider.read(this.query)).then(async (result: any) => {
				if (result?.data?.length > 0) {
					this.configOptions = result.data;
					this.columns = [
						...new Map(
							this.configOptions.map((i) => [i['Code'], { Code: i.Code, Name: i.Name, DataType: i.DataType, Sort: i.Sort }]).sort((a, b) => a[1].Sort - b[1].Sort)
						).values(),
					];
					console.log(this.columns);

					//#region preload one time datasource
					if (this.configOptions.some((d) => d.SelectOptions && d.SelectOptions.includes('"Model": "WMS_Location"'))) {
						await this.locationProvider.read({ Skip: 0, Take: 5000 }).then((resp) => {
							this.locationList = resp['data'];
						});
					}
					if (this.configOptions.some((d) => d.SelectOptions && d.SelectOptions.includes('"Model": "WMS_Zone"'))) {
						await this.zoneProvider.read({ Skip: 0, Take: 5000 }).then((resp) => {
							this.zoneList = resp['data'];
						});
					}
					if (this.configOptions.some((d) => d.SelectOptions && d.SelectOptions.includes('"Model": "WMS_Location"'))) {
						await this.locationProvider.read({ Skip: 0, Take: 5000 }).then((resp) => {
							this.locationList = resp['data'];
						});
						if (this.configOptions.some((d) => d.SelectOptions && d.SelectOptions.includes('"Model": "WMS_Zone"'))) {
							await this.zoneProvider.read({ Skip: 0, Take: 5000 }).then((resp) => {
								this.zoneList = resp['data'];
							});
						}
					}
					if (this.configOptions.some((d) => d.SelectOptions && d.SelectOptions.includes('"Model": "WMS_PutawayStrategy"'))) {
						await this.putawayStrategyProvider.read({ Skip: 0, Take: 5000 }).then((resp) => {
							this.putawayStrategyList = resp['data'];
						});
					}
					if (this.configOptions.some((d) => d.SelectOptions && d.SelectOptions.includes('"Model": "WMS_AllocationStrategy"'))) {
						await this.allocationStrategyProvider.read({ Skip: 0, Take: 5000 }).then((resp) => {
							this.allocationStrategyList = resp['data'];
						});
					}
					//#endregion

					this.columns
						.map((c) => c.Code)
						.forEach(async (code) => {
							let configOption = this.configOptions.find((d) => d.Code == code);
							this.itemsState.forEach(async (b) => {
								let field: any = {};
								field.type = configOption.DataType;
								field.label = configOption.Name;
								field.id = 'ParsedValue';
								field.saveObject = false;
								let isLoadingAsync = false;

								if (field.type == 'select' || field.type == 'select-staff') {
									field.dataSource = []; //select
									field.type = 'ng-select-level';
									try {
										let selectOption = JSON.parse(configOption.SelectOptions);
										field.multiple = selectOption?.Multiple || false;
										field.bindValue = selectOption?.BindValue || 'Id';
										field.bindLabel = selectOption?.BindLabel || 'Name';
										if (selectOption) {
											switch (selectOption.Model) {
												case 'SYS_Type':
													await this.env.getType(selectOption.Key, true).then((data) => {
														field.dataSource = [...data];
													});
													break;
												case 'SYS_Status':
													await this.env.getStatus(selectOption.Key).then((data) => {
														field.dataSource = [...data];
													});
													break;
												case 'HRM_Staff':
													field.imgPath = environment.staffAvatarsServer;
													field.type = 'ng-select-staff';
													field.bindLabel = 'FullName';
													field.dataSource = this.buildSelectDataSource((term) => {
														return this.staffProvider.search({
															Take: 20,
															Skip: 0,
															IDDepartment: this.env.selectedBranchAndChildren,
															Term: term,
														});
													});

													// {
													// 	page: this,
													// 	loading: false,
													// 	input$: new Subject<string>(),
													// 	selected: [],
													// 	items$: null,
													// 	initSearch() {
													// 		this.loading = false;
													// 		this.items$ = concat(
													// 			of(this.selected),
													// 			this.input$.pipe(
													// 				distinctUntilChanged(),
													// 				tap(() => (this.loading = true)),
													// 				switchMap((term) =>
													// 					this.page.staffProvider
													// 						.search({
													// 							Take: 20,
													// 							Skip: 0,
													// 							IDDepartment: this.page.env.selectedBranchAndChildren,
													// 							Term: term,
													// 						})
													// 						.pipe(
													// 							catchError(() => of([])),
													// 							tap(() => (this.loading = false))
													// 						)
													// 				)
													// 			)
													// 		);
													// 	},
													// };
													field.saveObject = true;
													isLoadingAsync = true;
													break;
												case 'CRM_Contact':
													field.imgPath = environment.staffAvatarsServer;
													field.type = 'ng-select-bp';
													field.bindLabel = 'Name';
													field.dataSource = this.buildSelectDataSource((term) => {
														return this.contactProvider.search({
															Take: 20,
															Skip: 0,
															IDDepartment: this.env.selectedBranchAndChildren,
															Term: term,
														});
													});

													// {

													// 	page: this,
													// 	loading: false,
													// 	input$: new Subject<string>(),
													// 	selected: [],
													// 	items$: null,
													// 	initSearch() {
													// 		this.loading = false;
													// 		this.items$ = concat(
													// 			of(this.selected),
													// 			this.input$.pipe(
													// 				distinctUntilChanged(),
													// 				tap(() => (this.loading = true)),
													// 				switchMap((term) =>
													// 					this.page.contactProvider
													// 						.search({
													// 							Take: 20,
													// 							Skip: 0,
													// 							IDDepartment: this.page.env.selectedBranchAndChildren,
													// 							Term: term,
													// 						})
													// 						.pipe(
													// 							catchError(() => of([])),
													// 							tap(() => (this.loading = false))
													// 						)
													// 				)
													// 			)
													// 		);
													// 	},
													// };
													field.saveObject = true;
													isLoadingAsync = true;
													break;
												case 'FINANCE_TaxDefinition':
													field.dataSource = this.taxDefinitionList.filter((d) => d.Category == selectOption.Category);
													break;
												case 'WMS_PriceList':
													field.dataSource = this.priceList.filter((d) => d.IsPriceListForVendor == selectOption.IsPriceListForVendor);
													break;
												case 'BRA_Branch':
													field.type = 'ng-select-level';
													if (selectOption.BranchType == 'Warehouse') {
														this.env.getBranch(b.Id, true).then((result) => {
															field.dataSource = [b];
															field.dataSource.push(...result);
															field.dataSource.forEach((i) => {
																i.disabled = true;
																if (i.Type == 'Warehouse' && i.Id == b.Id) i.disabled = false;
															});
															this.markNestedNode(field.dataSource, b.Id, 'Warehouse');
														});
													} else if (selectOption.BranchType == 'JobTitle') {
														this.env.getBranch(b.Id, true).then((result) => {
															field.dataSource = [b];
															field.dataSource.push(...result);
															field.dataSource.forEach((i) => {
																i.disabled = true;
																if (i.Type == 'JobTitle' && i.Id == b.Id) i.disabled = false;
															});
															this.markNestedNode(field.dataSource, b.Id, 'JobTitle');
														});
													} else {
														this.env.getBranch(b.Id, true).then((result) => {
															field.dataSource = [b];
															field.dataSource.push(...result);
														});
													}
													break;
												case 'BRA_BranchJobTitle':
													field.type = 'ng-select-level';
													this.env.getJobTitle(b.Id, true).then((result) => {
														field.dataSource = [...result];
													});
													//field.dataSource = [...this.env.jobTitleList];
													break;
												case 'WMS_Zone':
													field.type = 'ng-select';
													field.dataSource = [...this.zoneList?.filter((d) => d.IDBranch == b.Id)];
													break;
												case 'WMS_Location':
													field.type = 'ng-select';
													field.dataSource = [...this.locationList?.filter((d) => d.IDBranch == b.Id)];
													break;
												case 'WMS_PutawayStrategy':
													field.type = 'ng-select';
													field.dataSource = [...this.putawayStrategyList?.filter((d) => d.IDBranch == b.Id)];
													break;
												case 'WMS_AllocationStrategy':
													field.type = 'ng-select';
													field.dataSource = [...this.allocationStrategyList?.filter((d) => d.IDBranch == b.Id)];
													break;
											}
										}
									} catch (error) {
										console.log(error);
									}
								}
								b[code] = {};
								let config = this.items.find((d) => b.Id == d.IDBranch && d.Code == code);

								let setting = {
									Id: config?.Id,
									Code: config?.Code,
									Value: config?.Value,
									ValueObject: config?.Value,
								};
								if (configOption.DefaultValue) {
									setting.Value = configOption.DefaultValue;
								}
								if (setting?.Value) {
									try {
										setting.ValueObject = JSON.parse(setting.Value);
									} catch (error) {}
								}
								let value;
								if (setting.ValueObject) {
									if (Array.isArray(setting.ValueObject)) {
										// Handle case where ValueObject is an array
										value = setting.ValueObject.map((item) => item.Id); // Example processing of array
									} else if (typeof setting.ValueObject === 'object' && setting.ValueObject !== null) {
										// Handle case where ValueObject is an object
										if (setting.ValueObject.hasOwnProperty('Id')) value = setting.ValueObject.Id;
										else if (setting.ValueObject.hasOwnProperty('Code')) value = setting.ValueObject.Code;
										// Example processing of object
									} else {
										// Handle case where ValueObject is a primitive type (string, number, boolean, etc.)
										value = setting.ValueObject;
									}
								} else {
									value = null; // or some default value if needed
								}
								field.form = this.formBuilder.group({
									IDBranch: [b.Id],
									Id: [setting.Id],
									Code: [code],
									ParsedValue: [value],
									Value: [''],
								});

								!this.pageConfig.canEdit ? field.form.disable() : field.form.enable();
								if (!config || config?.Value == "null" || config?.Value == "\"\"") field.showEdit = true;
								else field.showed = true;
								//  b._data = config;
								// b._field = field;
								b[code].InheritBranch = config?.InheritBranch;
								b[code]._field = field;
								if (isLoadingAsync) {
									if (setting.ValueObject) b[code]._field.dataSource.selected = !b[code]._field.multiple ? [setting.ValueObject] : setting.ValueObject;

									b[code]._field.dataSource.initSearch();
								}
							});
						});
				}
			});
		}
		console.log(this.columns);
		console.log(this.itemsState);
	}
	markNestedNode(ls, Id, openType) {
		ls.filter((d) => d.IDParent == Id).forEach((i) => {
			if (openType.includes(i.Type)) i.disabled = false;
			this.markNestedNode(ls, i.Id, openType);
		});
	}

	changeShow(field) {
		if (this.pageConfig.canEdit) {
			field.showed = true;
			field.show = true;
			field.form.enable();
		}
	}
	saveChangeDetail(field, event) {
		let saveValue = '';
		let formGroup = field.form;
		if (event.type === 'ionChange' && event.detail && event.detail.hasOwnProperty('checked')) {
			saveValue = event.detail.checked.toString();
		} else if (!field.saveObject) {
			saveValue = formGroup.get('ParsedValue').value;
		} else {
			saveValue = JSON.stringify(event);
		}
		formGroup.get('Value').setValue(saveValue);

		return new Promise((resolve, reject) => {
			this.pageProvider.save(formGroup.getRawValue()).then((resp) => {
				formGroup.get('Id').setValue(resp['Id']);
				this.env.showMessage('Saving completed!', 'success');
			});
		});
	}

	toggleRowAll() {
		this.isAllRowOpened = !this.isAllRowOpened;
		this.itemsState.forEach((i) => {
			i.showdetail = !this.isAllRowOpened;
			this.toggleRow(this.itemsState, i, true);
		});
	}
}
