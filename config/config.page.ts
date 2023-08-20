
import { ChangeDetectorRef, Component } from '@angular/core';
import { NavController, ModalController, AlertController, LoadingController, PopoverController } from '@ionic/angular';
import { EnvService } from 'src/app/services/core/env.service';
import { PageBase } from 'src/app/page-base';
import { BRA_BranchProvider, SYS_ConfigOptionProvider, SYS_ConfigProvider } from 'src/app/services/static/services.service';
import { lib } from 'src/app/services/static/global-functions';
import { FormBuilder, FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-config',
    templateUrl: 'config.page.html',
    styleUrls: ['config.page.scss']
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
        public cdr: ChangeDetectorRef,
    ) {
        super();
        this.item = {};
        this.pageConfig.isShowFeature = true;
        this.segmentView = this.route.snapshot?.paramMap?.get('segment');
    }

    optionQuery = { Keyword: '', AllChildren: true, AllParent: true };

    preLoadData(event) {
        this.subOptions = null;
        Promise.all([
            this.sysConfigOptionProvider.read(this.optionQuery),
            
            // this.branchProvider.search({ Skip: 0, Take: 5000, Type_ne: 'TitlePosition', Id: this.env.selectedBranchAndChildren }).toPromise(),
        ]).then((values: any) => {
            this.optionGroup = lib.listToTree(values[0]['data']);

            
            this.branchList = this.env.branchList;
            this.selectedBranch = this.branchList.find(d => d.Id == this.id);
            if (!this.selectedBranch || this.selectedBranch.disabled) {
                this.selectedBranch = this.branchList.find(d => d.disabled == false);
            }
            super.preLoadData(event);

            // let data = values[1].filter(d => d.Type != 'TitlePosition')
            // for (let i = 0; i < data.length; i++) {
            //     const it = data[i];
            //     it.disabled = true;
            // }
            // lib.buildFlatTree(data, this.branchList).then((result: any) => {
            //     this.branchList = result;

            //     let sb = this.branchList.find(d => d.Id == this.env.selectedBranch);
            //     if (sb) {
            //         sb.disabled = false;
            //     }
            //     lib.markNestedNode(this.branchList, this.env.selectedBranch, 'disabled', true);

            //     this.selectedBranch = this.branchList.find(d => d.Id == this.id);
            //     if (!this.selectedBranch || this.selectedBranch.disabled) {
            //         this.selectedBranch = this.branchList.find(d => d.disabled == false);
            //     }
            //     super.preLoadData(event);
            // });
        });
    }

    
    loadData(event) {
        if (this.selectedBranch) {
            this.query.IDBranch = this.selectedBranch.Id;
            this.pageProvider.read(this.query).then(resp => {
                this.items = resp['data'];
                this.loadedConfig = true;
                this.loadedData(event);
            });
        }
    }

    configList = [];
    loadedData(event) {
        this.configList = [...this.items];
        super.loadedData(event);
        this.loadNode();
    }

    selectBranch() {
        this.loadData(null);
        this.loadNode();
    }

    selectedOption = null;

    loadNode(option = null) {
        if (!option && this.segmentView) {
            option = this.optionGroup.find(d => d.Code == this.segmentView);
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
