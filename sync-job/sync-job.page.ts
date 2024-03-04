import { Component } from '@angular/core';
import { NavController, ModalController, AlertController, LoadingController, PopoverController } from '@ionic/angular';
import { EnvService } from 'src/app/services/core/env.service';
import { PageBase } from 'src/app/page-base';
import { BRA_BranchProvider, SYS_SyncJobProvider, WMS_ZoneProvider } from 'src/app/services/static/services.service';
import { Location } from '@angular/common';

@Component({
    selector: 'app-sync-job',
    templateUrl: 'sync-job.page.html',
    styleUrls: ['sync-job.page.scss'],
})
export class SyncJobPage extends PageBase {
    statusList = [];
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

    sync(){
        if (this.submitAttempt) return;
        let obj = {
            RefNums: [],
            JIds: this.selectedItems.map(p => p.Id)
        };
        if (this.submitAttempt == false) {
            this.submitAttempt = true;
        this.pageProvider.commonService.connect('POST', 'SYS/SyncJob/Exec/', obj).toPromise()
            .then(() => {
                            
                //this.loadData();
                this.submitAttempt = false;

            }).catch(err => {
                this.submitAttempt = false;
            });
        }
    }
    loadedData(event) {
        this.items.forEach(i => { 
            i.BranchName = this.env.branchList.find(b => i.Id == b.Id)?.Name;
        });
        super.loadedData(event);

    }

}
