import { Component, ChangeDetectorRef } from '@angular/core';
import { NavController, ModalController, NavParams, LoadingController, AlertController } from '@ionic/angular';
import { PageBase } from 'src/app/page-base';
import { ActivatedRoute } from '@angular/router';
import { EnvService } from 'src/app/services/core/env.service';
import { SYS_FormProvider } from 'src/app/services/static/services.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';


@Component({
    selector: 'app-form-detail',
    templateUrl: './form-detail.page.html',
    styleUrls: ['./form-detail.page.scss'],
})
export class FormDetailPage extends PageBase {
    formGroup: FormGroup;

    typeList = [
        { Id: 10, Name: 'Phân hệ' },
        { Id: 11, Name: 'Nhóm chức năng' },
        { Id: 1, Name: 'Menu chức năng' },
        { Id: 2, Name: 'Chức năng (không hiện trên menu)' },
        { Id: 3, Name: 'Chức năng trong form' },
        { Id: 0, Name: 'Public - không cần đăng nhập' },

    ];

    constructor(
        public pageProvider: SYS_FormProvider,
        public env: EnvService,
        public navCtrl: NavController,
        public route: ActivatedRoute,

        public modalController: ModalController,
        public alertCtrl: AlertController,
        public navParams: NavParams,
        public formBuilder: FormBuilder,
        public cdr: ChangeDetectorRef,
        public loadingController: LoadingController,
    ) {
        super();
        this.pageConfig.isDetailPage = true;
        this.id = this.route.snapshot.paramMap.get('id');
        this.formGroup = formBuilder.group({
            IDParent: [''],
            Type: [''],
            Id: [''],
            Code: [''],
            Name: ['', Validators.required],
            Remark: [''],
            Icon: [''],
            APIs: [''],
            Sort: [''],
            BadgeColor: ['']
        });
    }

    preLoadData() {
        if(this.pageConfig.canEditFunction){
            this.pageConfig.canEdit = true;
        }
        
        if (this.navParams) {
            this.items = JSON.parse(JSON.stringify(this.navParams.data.items));
            this.items.forEach(i => {
                let prefix = '';
                for (let j = 1; j < i.level; j++) {
                    prefix += '- '
                }
                i.Name = prefix + i.Name;
            })

            this.item = JSON.parse(JSON.stringify(this.navParams.data.item));
            this.id = this.navParams.data.id;

            this.removeCurrentNode();
            this.cdr.detectChanges();

            if (this.pageConfig.canEditFunction) {
                this.formGroup.enable()
            }

            

            super.loadedData();
        }
    }

    refresh(event?: any): void {
        this.preLoadData();
    }

    removeCurrentNode() {
        let currentItem = this.items.find(i => i.Id == this.id);
        if (currentItem) {
            currentItem.Flag = true;
            this.markNestedNode(this.items, this.id);
        }
    }

    markNestedNode(ls, Id) {
        ls.filter(d => d.IDParent == Id).forEach(i => {
            i.Flag = true;
            this.markNestedNode(ls, i.Id);
        });
    }

}
