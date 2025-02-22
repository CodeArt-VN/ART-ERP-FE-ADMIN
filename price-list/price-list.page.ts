import { Component } from '@angular/core';
import { NavController, ModalController, AlertController, LoadingController, PopoverController } from '@ionic/angular';
import { EnvService } from 'src/app/services/core/env.service';
import { PageBase } from 'src/app/page-base';
import { BRA_BranchProvider, WMS_PriceListProvider } from 'src/app/services/static/services.service';
import { Location } from '@angular/common';
import { lib } from 'src/app/services/static/global-functions';

@Component({
	selector: 'app-price-list',
	templateUrl: 'price-list.page.html',
	styleUrls: ['price-list.page.scss'],
	standalone: false,
})
export class PriceListPage extends PageBase {
	constructor(
		public pageProvider: WMS_PriceListProvider,
		public branchProvider: BRA_BranchProvider,
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

	loadedData(event) {
		this.items.forEach((i) => {
			i.BasePriceListName = lib.getAttrib(i.IDBasePriceList, this.items);
		});
		super.loadedData(event);
	}
}
