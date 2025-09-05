import { Component, ChangeDetectorRef } from '@angular/core';
import { NavController, LoadingController, AlertController } from '@ionic/angular';
import { PageBase } from 'src/app/page-base';
import { ActivatedRoute } from '@angular/router';
import { EnvService } from 'src/app/services/core/env.service';
import { SYS_ConfigProvider, SYS_PrinterProvider } from 'src/app/services/static/services.service';
import { FormBuilder, Validators, FormControl } from '@angular/forms';
import { CommonService } from 'src/app/services/core/common.service';
import { PrintingService } from 'src/app/services/util/printing.service';

@Component({
	selector: 'app-printer-detail',
	templateUrl: './printer-detail.page.html',
	styleUrls: ['./printer-detail.page.scss'],
	standalone: false,
})
export class PrinterDetailPage extends PageBase {
	printers; // data source
	printingServerConfig;
	printerList = []; // all printer in branch;

	constructor(
		public pageProvider: SYS_PrinterProvider,
		public env: EnvService,
		public printingService: PrintingService,
		public printerProvider: SYS_PrinterProvider,
		public sysConfigProvider: SYS_ConfigProvider,
		public navCtrl: NavController,
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
			IDBranch: [this.env.selectedBranch],
			Id: new FormControl({ value: '', disabled: true }),
			Code: [''],
			Name: ['', Validators.required],
			Host: new FormControl({ value: '', disabled: true }),
			Port: new FormControl({ value: '', disabled: true }),
			IsSecure: new FormControl({ value: '', disabled: true }),
			MarginTop: [''],
			MarginRight: [''],
			MarginBottom: [''],
			MarginLeft: [''],
			PageSize: [''],
			Scale: [''],
			Remark: [''],
			Sort: [''],
			IsDisabled: new FormControl({ value: '', disabled: true }),
			IsDeleted: new FormControl({ value: '', disabled: true }),
			CreatedBy: new FormControl({ value: '', disabled: true }),
			CreatedDate: new FormControl({ value: '', disabled: true }),
			ModifiedBy: new FormControl({ value: '', disabled: true }),
			ModifiedDate: new FormControl({ value: '', disabled: true }),
		});
		this.subscriptions.push(
			this.printingService.tracking.subscribe((status) => {
				if (status == 'connected') {
					this.loadPrinterList(this.env.selectedBranch);
				}
			})
		);
	}

	segmentView = 's1';
	segmentChanged(ev: any) {
		this.segmentView = ev.detail.value;
	}

	async loadedData(event?: any) {
		this.printerList = [];
		super.loadedData(event);
		let branchID = this.env.selectedBranch;
		if (this.item?.IDBranch > 0) branchID = this.item.IDBranch;

		if (this.item?.Code && this.printerList.length == 0) this.printerList = [{ Name: this.item.Code, Code: this.item.Code }];

		if (this.printingService.isReady) this.loadPrinterList(branchID);
	}

	loadPrinterList(branchID) {
		this.printingService.getAvailablePrinters(branchID).then((rs: any) => {
			if (rs && rs.printers.length > 0) {
				this.printerList = [
					...rs.printers.map((i) => {
						return { Name: i, Code: i };
					}),
				];
				this.printingServerConfig = rs?.config;
			} else this.env.showMessage('No printers found from {value}!', 'warning', rs?.config.PrintingHost, null, true);
		});
	}

	changePrinterCode() {
		this.formGroup.get('IsSecure').setValue(this.printingServerConfig?.PrintingIsSecure);
		this.formGroup.get('Host').setValue(this.printingServerConfig?.PrintingHost);
		this.formGroup.get('Port').setValue(this.printingServerConfig?.PrintingPort);
		this.formGroup.get('IsSecure').markAsDirty();
		this.formGroup.get('Host').markAsDirty();
		this.formGroup.get('Port').markAsDirty();
		this.saveChange();
	}

	async saveChange() {
		super.saveChange2();
	}

	async loadprintingServerConfig() {
		await this.loadedData();
		this.changePrinterCode();
	}
}
