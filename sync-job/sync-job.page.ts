import { Component } from '@angular/core';
import { NavController, ModalController, AlertController, LoadingController, PopoverController } from '@ionic/angular';
import { EnvService } from 'src/app/services/core/env.service';
import { PageBase } from 'src/app/page-base';
import { BRA_BranchProvider, SYS_SyncJobProvider, WMS_ZoneProvider } from 'src/app/services/static/services.service';
import { Location } from '@angular/common';
import { SortConfig } from 'src/app/models/options-interface';

@Component({
    selector: 'app-sync-job',
    templateUrl: 'sync-job.page.html',
    styleUrls: ['sync-job.page.scss'],
})
export class SyncJobPage extends PageBase {
    constructor(
        public pageProvider: SYS_SyncJobProvider,
        public branchProvider: BRA_BranchProvider,
        public modalController: ModalController,
		public popoverCtrl: PopoverController,
        public alertCtrl: AlertController,
        public loadingController: LoadingController,
        public env: EnvService,
        public navCtrl: NavController,
        public location: Location,
    ) {
        super();
        this.pageConfig.canSync = true;
        
    }

    preLoadData(event?: any): void {
        let sorted: SortConfig[] = [
            { Dimension: 'Id', Order: 'DESC' }
        ];
        this.pageConfig.sort = sorted;
        super.preLoadData(event);
    }
    
    sync(){
        if (this.submitAttempt) return;
        let obj = {
            RefNums: [],
            JIds: this.selectedItems.map(p => p.Id)
        };
        if (this.submitAttempt == false) {
            this.submitAttempt = true;
            this.env.showLoading('Please wait for a few moments', this.pageProvider.commonService.connect('POST', 'SYS/SyncJob/Exec/', obj).toPromise())
            .then(() => {
                this.env.showMessage('Sync completed', 'success');
                this.refresh();
                this.submitAttempt = false;

            }).catch(err => {
                this.env.showPrompt(err.error.ExceptionMessage, null , err.error.Message, 'Xác nhận', null, null).then(_=>{
                }).catch(e => { });
                console.log(err.error)
                this.submitAttempt = false;
            });
        }
    }
}
