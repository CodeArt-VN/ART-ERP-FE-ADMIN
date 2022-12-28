import { Component, ViewChild } from '@angular/core';
import { NavController, ModalController, AlertController, LoadingController } from '@ionic/angular';
import { EnvService } from 'src/app/services/core/env.service';
import { PageBase } from 'src/app/page-base';
import { SYS_FormProvider } from 'src/app/services/static/services.service';
import { FormDetailPage } from '../form-detail/form-detail.page';



@Component({
    selector: 'app-form',
    templateUrl: 'form.page.html',
    styleUrls: ['form.page.scss']
})
export class FormPage extends PageBase {
    itemsState: any = [];
    itemsView = [];
    isAllRowOpened = true;
    typeList = [];

    constructor(
        public pageProvider: SYS_FormProvider,
        public modalController: ModalController,
        public alertCtrl: AlertController,
        public loadingController: LoadingController,
        public env: EnvService,
        public navCtrl: NavController,
    ) {
        super();
        this.query.Take = 5000;
        this.query.AllChildren = true;
        this.query.AllParent = true;
        
    }

    loadedData(event) {
        this.buildFlatTree(this.items, this.itemsState, this.isAllRowOpened).then((resp:any)=>{
            this.itemsState = resp;
            this.itemsView = this.itemsState.filter(d=>d.show);
        });
        super.loadedData(event);
    }

    toggleRowAll() {
        this.isAllRowOpened = !this.isAllRowOpened;
        this.itemsState.forEach(i => {
            i.showdetail = !this.isAllRowOpened;
            this.toggleRow(this.itemsState, i, true);
        });
        this.itemsView = this.itemsState.filter(d=>d.show);
    }

    toggleRow(ls, ite, toogle = false){
        super.toggleRow(ls, ite, toogle);
        this.itemsView = this.itemsState.filter(d=>d.show);
    }

    async showModal(i) {
        const modal = await this.modalController.create({
            component: FormDetailPage,
            componentProps: {
                items : this.itemsState,
                item: i,
                id: i.Id
            },
            cssClass: 'my-custom-class'
        });
        return await modal.present();
    }

    add() {
        let newItem = {
            Id: 0,
            IsDisabled: false,
        };
        this.showModal(newItem);
    }

}
