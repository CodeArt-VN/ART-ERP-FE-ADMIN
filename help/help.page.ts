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
	isShowAll=false;

	constructor(
		public pageProvider: SYS_FormProvider,
		public webContentProvider: WEB_ContentProvider,
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

	loadData(event = null) {
		if (this.pageConfig.isDetailPage) {
			this.loadAnItem(event);
		} else {
			this.parseSort();

			if (this.pageProvider && !this.pageConfig.isEndOfData) {
				this.env.getStorage('lang').then((lang) => {
					Promise.all([this.webContentProvider.read(), this.env.getStorage('UserProfile')])
						.then(([webContent, userProfile]: any) => {
							console.log('WEB CONTENT : ', webContent);
							this.webContentList = webContent.data.filter((d: any) => d.Code?.includes(lang));
							let result = userProfile.Forms;

							const shouldFilter = this.query?.Keyword && this.query.Keyword !== '';

							if (shouldFilter) {
								result = result.filter((e) => e.Name.toLowerCase().includes(this.query.Keyword.toLowerCase()));
							}

							result = result.filter((d) => !d.Code.startsWith('can'));

							if (result.length === 0) {
								this.pageConfig.isEndOfData = true;
							}

							if (result.length > 0) {
								let firstRow = result[0];

								// Fix duplicate rows
								if (this.items.findIndex((d) => d.Id === firstRow.Id) === -1) {
									this.items = [...this.items, ...result];
								}
							}

							this.loadedData(event);
						})
						.catch((err) => {
							if (err.message != null) {
								this.env.showMessage(err.message, 'danger');
							} else {
								this.env.showMessage('Cannot extract data', 'danger');
							}

							this.loadedData(event);
						});
				});

				// this.webContentProvider.read().then((data) => {
				// 	console.log('WEB CONTENT : ' , data);
				// });

				// this.env
				// 	.getStorage('UserProfile')
				// 	.then((i) => {
				// 		let result = i.Forms;

				// 		const shouldFilter = this.query?.Keyword && this.query.Keyword !== '';

				// 		if (shouldFilter) {
				// 			result = result.filter((e) => {
				// 				const queryKeyword = e.Name.toLowerCase().includes(this.query.Keyword.toLowerCase());
				// 				return queryKeyword;
				// 			});
				// 		}
				// 		result = result.filter((d) => !d.Code.startsWith('can'));
				// 		return result;
				// 	})
				// 	.then((data) => {
				// 		if (data.length == 0) {
				// 			this.pageConfig.isEndOfData = true;
				// 		}
				// 		if (data.length > 0) {
				// 			let firstRow = data[0];

				// 			//Fix dupplicate rows
				// 			if (this.items.findIndex((d) => d.Id == firstRow.Id) == -1) {
				// 				this.items = [...this.items, ...data];
				// 			}
				// 		}
				// 		this.loadedData(event);
				// 	})
				// 	.catch((err) => {
				// 		if (err.message != null) {
				// 			this.env.showMessage(err.message, 'danger');
				// 		} else {
				// 			this.env.showMessage('Cannot extract data', 'danger');
				// 		}

				// 		this.loadedData(event);
				// 	});
			} else {
				this.loadedData(event);
			}
		}
	}

	loadedData(event) {
		if(!this.isShowAll){
			this.webContentList.forEach((d) => {
				const regex = /help\/(.+)/;
				const match = d.Code.match(regex);
				if (match && (match[1].match(/\//g) || []).length == 1) {
					this.items.find(x=> x.Code == match[1].split('/')[1])._WebContent = d;
				}
			});
			let parents = new Set();
			 this.items.filter(d=> d._WebContent).forEach((d)=>{
				parents = new Set([...parents, ...this.getParent(d.IDParent)]);
	
			 });
			 this.items = [...this.items.filter(d=> d._WebContent), ...[...parents].filter((p:any) => !this.items.some(d => d.Id === p.Id && d._WebContent))];
		}
	
		this.buildFlatTree(this.items, this.itemsState, this.isAllRowOpened).then((resp: any) => {
			this.itemsState = resp;
			this.itemsView = this.itemsState.filter((d) => d.show);
		});
		super.loadedData(event);
	}

	showAll(e:any){
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
		let parent = this.items.find((d) => d.Id == Id);
		if (parent) {
			result.unshift(parent);
			if (parent.IDParent) {
				this.getParent(parent.IDParent, result);
			}
		}
		return result;
	}

}
