import { Component, ViewChild, ViewEncapsulation } from '@angular/core';
import { NavController, ModalController, AlertController, LoadingController } from '@ionic/angular';
import { EnvService } from 'src/app/services/core/env.service';
import { PageBase } from 'src/app/page-base';
import { SYS_FormProvider } from 'src/app/services/static/services.service';
import { FormDetailPage } from '../form-detail/form-detail.page';

@Component({
    selector: 'app-help',
    templateUrl: 'help.page.html',
    styleUrls: ['help.page.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: false
})
export class HelpPage extends PageBase {
  itemsState: any = [];
  itemsView = [];
  isAllRowOpened = false;
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
        this.env
          .getStorage('UserProfile')
          .then((i) => {
            let result = i.Forms;

            const shouldFilter = this.query?.Keyword && this.query.Keyword !== '';

            if (shouldFilter) {
              result = result.filter((e) => {
                const queryKeyword = e.Name.toLowerCase().includes(this.query.Keyword.toLowerCase());
                return queryKeyword;
              });
            }
            result = result.filter((d) => !d.Code.startsWith('can'));
            return result;
          })
          .then((data) => {
            if (data.length == 0) {
              this.pageConfig.isEndOfData = true;
            }
            if (data.length > 0) {
              let firstRow = data[0];

              //Fix dupplicate rows
              if (this.items.findIndex((d) => d.Id == firstRow.Id) == -1) {
                this.items = [...this.items, ...data];
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
      } else {
        this.loadedData(event);
      }
    }
  }

  loadedData(event) {
    this.buildFlatTree(this.items, this.itemsState, this.isAllRowOpened).then((resp: any) => {
      this.itemsState = resp;
      this.itemsView = this.itemsState.filter((d) => d.show);
    });
    super.loadedData(event);
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
}
