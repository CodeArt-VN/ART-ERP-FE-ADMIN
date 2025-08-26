import { ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AlertController, LoadingController, ModalController, NavController, PopoverController } from '@ionic/angular';
import { PageBase } from 'src/app/page-base';
import { EnvService } from 'src/app/services/core/env.service';
import { lib } from 'src/app/services/static/global-functions';
import { BRA_BranchProvider, SYS_ConfigOptionProvider, SYS_ConfigProvider } from 'src/app/services/static/services.service';

@Component({
	selector: 'app-config',
	templateUrl: 'config.page.html',
	styleUrls: ['config.page.scss'],
	standalone: false,
})
export class ConfigPage extends PageBase {
	branchList = [];
	selectedBranch = null;
	optionGroup = [];
	subOptions = null;
	segmentView = '';
	loadedConfig = false;

	constructor(
		public pageProvider: SYS_ConfigProvider,
		public sysConfigOptionProvider: SYS_ConfigOptionProvider,
		public branchProvider: BRA_BranchProvider,
		public modalController: ModalController,
		public popoverCtrl: PopoverController,
		public alertCtrl: AlertController,
		public loadingController: LoadingController,
		public env: EnvService,
		public route: ActivatedRoute,
		public navCtrl: NavController,
		public formBuilder: FormBuilder,
		public cdr: ChangeDetectorRef
	) {
		super();
		this.item = {};
		this.pageConfig.isShowFeature = true;
		this.pageConfig.ShowArchive = false;
		this.pageConfig.isFeatureAsMain = true;
		this.segmentView = this.route.snapshot?.paramMap?.get('segment');
	}

	optionQuery = { Keyword: '', AllChildren: true, AllParent: true, Take: 5000 };

	preLoadData(event) {
		Promise.all([this.sysConfigOptionProvider.read(this.optionQuery)]).then((values: any) => {
			this.optionGroup = lib.listToTree(values[0]['data']);
			this.branchList = this.env.branchList;
			this.selectedBranch = this.branchList.find((d) => d.Id == (this.id || this.env.selectedBranch));
			if (!this.selectedBranch || this.selectedBranch.disabled) {
				this.selectedBranch = this.branchList.find((d) => d.disabled == false);
			}

			if (!this.segmentView && this.pageConfig.pageName != 'config') {
				this.pageConfig.isShowFeature = false;
				if (this.pageConfig.pageName.toLowerCase().indexOf('pos') > -1) {
					this.segmentView = 'POS';
				}
				if (this.pageConfig.pageName.toLowerCase().indexOf('crm') > -1) {
					let nodeContactList = this.optionGroup.filter(d=>d.Code.toLowerCase().includes('contact'))
					if(nodeContactList.length > 1) {
						this.pageConfig.isShowFeature = true;
						this.optionGroup = this.optionGroup.filter(d => d.Code.toLowerCase().includes('contact'));
					}
					this.segmentView = nodeContactList[0].Code;
				}
			}

			super.loadedData(event);

			setTimeout(() => {
				this.loadNode();
			}, 0);
		});
	}

	loadData(event) {
		if (this.selectedBranch && this.subOptions) {
			this.query.Code_in = this.subOptions.flatMap((a) => a.children).map((m) => m.Code);
			this.query.IDBranch = this.selectedBranch.Id;
			this.env.showLoading('Please wait for a few moments', this.pageProvider.read(this.query)).then((resp) => {
				this.items = resp['data'];
				this.loadedConfig = true;
				this.loadedData(event);
			});
		} else {
			console.log('The branch not found');
		}
	}

	configList = [];
	loadedData(event) {
		this.configList = [...this.items];
		this.configList.forEach((c) => {
			if (!c.IDBranch) {
				c.IDBranch = this.selectedBranch.Id;
			}
			if (c._InheritedConfig) {
				if (c.Value == null || c.Value == 'null') {
					c.Value = c._InheritedConfig.Value;
				}

				c._InheritedConfig._Branches = this.env.branchList;
			}
		});

		super.loadedData(event);
	}

	selectBranch() {
		this.loadData(null);
		this.loadNode();
	}

	selectedOption = null;

	loadNode(option = null) {
		this.pageConfig.isSubActive = true;
		if (!option && this.segmentView) {
			option = this.optionGroup.find((d) => d.Code == this.segmentView);
		}

		if (!option) {
			option = this.optionGroup[0];
		}

		if (!option) {
			return;
		}

		this.selectedOption = option;

		this.segmentView = option.Code;
		this.subOptions = option.children;

		let newURL = '#/config/';
		if (this.selectedBranch) {
			newURL += option.Code + '/' + this.selectedBranch.Id;
		}
		history.pushState({}, null, newURL);

		this.loadData(null);
	}

	saveChange(e) {
		return new Promise((resolve, reject) => {
			Object.assign(this.item, this.formGroup.value);
			console.log(this.item);
			resolve(1);
		});
	}

	savedConfig(data) {
		this.items = [...data];
	}
}
