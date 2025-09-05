import { Component, ViewChild, ViewEncapsulation } from '@angular/core';
import { NavController, ModalController, AlertController, LoadingController } from '@ionic/angular';
import { EnvService } from 'src/app/services/core/env.service';
import { PageBase } from 'src/app/page-base';
import { SYS_FormProvider, WEB_ContentProvider } from 'src/app/services/static/services.service';
import { FormDetailPage } from '../form-detail/form-detail.page';
import { lib } from 'src/app/services/static/global-functions';

@Component({
	selector: 'app-help',
	templateUrl: 'help.page.html',
	styleUrls: ['help.page.scss'],
	encapsulation: ViewEncapsulation.None,
	standalone: false,
})
export class HelpPage extends PageBase {
	itemsState: any = [];
	itemsView = [];
	isAllRowOpened = false;
	typeList = [];
	webContentList = [];
	isShowAll = false;
	formList = [];

	constructor(
		public pageProvider: WEB_ContentProvider,
		public modalController: ModalController,
		public alertCtrl: AlertController,
		public loadingController: LoadingController,
		public env: EnvService,
		public navCtrl: NavController
	) {
		super();
		this.pageConfig.ShowAdd = false;
		this.pageConfig.ShowArchive = false;
		this.query.Take = 5000;
		this.query.AllChildren = true;
		this.query.AllParent = true;
	}

	preLoadData(event?: any): void {
		let functions = this.env.user.Forms;
		const shouldFilter = this.query?.Keyword && this.query.Keyword !== '';
		if (shouldFilter) functions = functions.filter((e) => e.Name.toLowerCase().includes(this.query.Keyword.toLowerCase()));

		functions = functions.filter((d) => !d.Code.startsWith('can'));

		if (functions.length === 0) this.pageConfig.isEndOfData = true;

		if (functions.length > 0) {
			let firstRow = functions[0];

			// Fix duplicate rows
			if (this.formList.findIndex((d) => d.Id === firstRow.Id) === -1) {
				this.formList = [...this.formList, ...functions];
			}
		}
		super.preLoadData(event);
	}

	loadData(event = null) {
		this.query.Language = this.env.language.current;
		this.query.Type = 'Help';
		super.loadData(event);
	}
	loadedData(event) {
		let forms = lib.cloneObject(this.formList);
		if (!this.isShowAll) {
			this.items.forEach((d) => {
				let f = forms.find((x) => 'help/' + x.Code == d.URL);
				if (f) {
					f._isHasWebContent = true;
					let index = forms.indexOf(f);
					if (index != -1) forms.push({ ...d, IDParent: f.Id, _isWebContent: true, Sort: -1 });
				}
			});
			let parents = new Set();
			forms
				.filter((d) => d._isHasWebContent || d._isWebContent)
				.forEach((d) => {
					parents = new Set([...parents, ...this.getParent(d.IDParent)]);
				});
			this.items = [
				...forms.filter((d) => d._isHasWebContent || d._isWebContent),
				...[...parents].filter((p: any) => !forms.some((d) => d.Id === p.Id && (d._isHasWebContent || d._isWebContent))),
			];
		} else {
			this.items.forEach((d) => {
				let f = forms.find((x) => 'help/' + x.Code == d.URL);
				if (f) {
					f._isHasWebContent = true;
					let index = forms.indexOf(f);
					if (index != -1) forms.push({ ...d, IDParent: f.Id, _isWebContent: true, Sort: -1 });
				}
			});
			this.items = forms;
		}

		this.buildFlatTree(this.items, this.itemsState, this.isAllRowOpened).then((resp: any) => {
			this.itemsState = resp;
			this.itemsView = this.itemsState.filter((d) => d.show);
		});
		super.loadedData(event);
	}

	showAll(e: any) {
		this.isShowAll = e.target.checked;
		this.items = [];
		this.loadData();
		// this.refresh();
	}

	toggleRowAll() {
		this.isAllRowOpened = !this.isAllRowOpened;
		this.itemsState.forEach((i) => {
			i.showdetail = !this.isAllRowOpened;
			this.toggleRow(this.itemsState, i, true);
		});
		this.itemsView = this.itemsState.filter((d) => d.show);
	}

	toggleRow(ls, ite, toogle = false) {
		super.toggleRow(ls, ite, toogle);
		this.itemsView = this.itemsState.filter((d) => d.show);
	}

	getParent(Id: number, result = []) {
		let parent = this.formList.find((d) => d.Id == Id);
		if (parent) {
			result.unshift(parent);
			if (parent.IDParent) {
				this.getParent(parent.IDParent, result);
			}
		}
		return result;
	}
}
