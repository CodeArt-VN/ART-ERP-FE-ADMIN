import { Component, ChangeDetectorRef, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AlertController, LoadingController, NavController } from '@ionic/angular';
import { PageBase } from 'src/app/page-base';
import { EnvService } from 'src/app/services/core/env.service';
import {
  CRM_ContactProvider,
  FINANCE_TaxDefinitionProvider,
  HRM_StaffProvider,
  SYS_ConfigProvider,
  WMS_PriceListProvider,
} from 'src/app/services/static/services.service';
import { concat, of, Subject } from 'rxjs';
import { catchError, distinctUntilChanged, switchMap, mergeMap, tap } from 'rxjs/operators';
import { ApiSetting } from 'src/app/services/static/api-setting';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-dynamic-config',
  templateUrl: './dynamic-config.component.html',
  styleUrls: ['./dynamic-config.component.scss'],
})
export class DynamicConfigComponent extends PageBase {
  configItems = null;
  priceList = [];
  taxDefinitionList = [];
  selectedBranch;
  optionList = null;
  isPreloaded = false;

  @Input() set options(value) {
    this.optionList = value;
    this.loadData(null);
  }

  @Input() set branch(value) {
    this.selectedBranch = value;
    this.loadData(null);
  }

  @Input() set configItem(value) {
    this.configItems = value;
    this.loadData(null);
  }

  @Output() savedConfig = new EventEmitter();

  constructor(
    public pageProvider: SYS_ConfigProvider,
    public priceListProvider: WMS_PriceListProvider,
    public taxDefinitionProvider: FINANCE_TaxDefinitionProvider,
    public staffProvider: HRM_StaffProvider,
    public contactProvider: CRM_ContactProvider,

    public env: EnvService,
    public route: ActivatedRoute,
    public alertCtrl: AlertController,
    public navCtrl: NavController,
    public formBuilder: FormBuilder,
    public cdr: ChangeDetectorRef,
    public loadingController: LoadingController,
  ) {
    super();
    this.pageConfig.isDetailPage = true;
  }

  preLoadData(event) {
    Promise.all([this.priceListProvider.read(), this.taxDefinitionProvider.read()]).then((result) => {
      this.priceList = result[0]['data'];
      this.taxDefinitionList = result[1]['data'];
      this.isPreloaded = true;
      super.preLoadData(event);
    });
  }

  async loadData(event) {
    if (!this.configItems || !this.selectedBranch || !this.optionList || !this.isPreloaded) {
      return;
    }
    this.item = {};
    for (let i = 0; i < this.optionList.length; i++) {
      const g = this.optionList[i];

      for (let j = 0; j < g.children.length; j++) {
        const c = g.children[j];

        c.type = c.DataType;
        c.label = c.Name;
        c.remark = c.Remark;
        c.labelForId = c.Code;
        c.disabled = !this.pageConfig.canEdit;

        if (c.type == 'select' || c.type == 'select-staff') {
          c.items = []; //select

          try {
            let selectOption = JSON.parse(c.SelectOptions);
            c.multiple = selectOption.Multiple || false;
            c.bindValue = selectOption.BindValue || '';
            c.bindLabel = selectOption.BindLabel || 'Name';

            if (selectOption && selectOption.Model == 'SYS_Type') {
              await this.env.getType(selectOption.Key, true).then((data) => {
                c.items = data;
              });
            } else if (selectOption && selectOption.Model == 'SYS_Status') {
              await this.env.getStatus(selectOption.Key).then((data) => {
                c.items = data;
              });
            } else if (selectOption && selectOption.Model == 'HRM_Staff') {
              c.imgPath = environment.staffAvatarsServer;
              c.type = 'select-staff';
              c.bindLabel = 'FullName';
              let searchInput$ = new Subject<string>();
              c.SearchLoading = false;
              c.SearchInput = searchInput$;
              c.SelectedList = [];
              c.DataSource = concat(
                of(c.SelectedList),
                c.SearchInput.pipe(
                  distinctUntilChanged(),
                  tap(() => (c.SearchLoading = true)),
                  switchMap((term) =>
                    this.staffProvider
                      .search({
                        Take: 20,
                        Skip: 0,
                        IDDepartment: this.env.selectedBranchAndChildren,
                        Term: term,
                      })
                      .pipe(
                        catchError(() => of([])),
                        tap(() => (c.SearchLoading = false)),
                      ),
                  ),
                ),
              );
            } else if (selectOption && selectOption.Model == 'CRM_Contact') {
              c.imgPath = environment.staffAvatarsServer;
              c.type = 'select-contact';
              c.bindLabel = 'Name';
              let searchInput$ = new Subject<string>();
              c.SearchLoading = false;
              c.SearchInput = searchInput$;
              c.SelectedList = [];
              c.DataSource = concat(
                of(c.SelectedList),
                c.SearchInput.pipe(
                  distinctUntilChanged(),
                  tap(() => (c.SearchLoading = true)),
                  switchMap((term) =>
                    this.contactProvider
                      .search({
                        Take: 20,
                        Skip: 0,
                        IDDepartment: this.env.selectedBranchAndChildren,
                        Term: term,
                      })
                      .pipe(
                        catchError(() => of([])),
                        tap(() => (c.SearchLoading = false)),
                      ),
                  ),
                ),
              );
            } else if (selectOption && selectOption.Model == 'FINANCE_TaxDefinition') {
              c.items = this.taxDefinitionList.filter((d) => d.Category == selectOption.Category);
            } else if (selectOption && selectOption.Model == 'WMS_PriceList') {
              c.items = this.priceList.filter((d) => d.IsPriceListForVendor == selectOption.IsPriceListForVendor);
            } else if (selectOption && selectOption.Model == 'BRA_Branch') {
              c.type = 'select-branch';
              c.bindValue = 'Id';
              c.items = this.env.branchList;
            } else if (selectOption && selectOption.Model == 'BRA_BranchJobTitle') {
              c.type = 'select-branch';
              c.bindValue = 'Id';
              c.items = this.env.jobTitleList;
            }
          } catch (error) {
            console.log(error);
          }
        }

        let setting = this.configItems ? this.configItems.find((d) => d.Code == c.Code) : null;
        if (!setting) {
          setting = {
            IDBranch: this.selectedBranch.Id,
            Id: 0,
            Code: c.Code,
            Value: null,
            ValueObject: null,
          };
          if (c.DefaultValue) {
            setting.Value = c.DefaultValue;
          }
          this.configItems.push(setting);
        }
        if (setting?.Value) {
          try {
            setting.ValueObject = JSON.parse(setting.Value);
          } catch (error) {
            //console.log(setting.Value, error);
          }
        }
        c.data = setting;
      }
    }

    super.loadedData(event);
  }

  // staffList$
  // staffListLoading = false;
  // staffListInput$ = new Subject<string>();
  // staffListSelected = [];
  // staffSelected = null;
  // staffSearch() {
  // 	this.staffListLoading = false;
  // 	this.staffList$ = concat(
  // 		of(this.staffListSelected),
  // 		this.staffListInput$.pipe(
  // 			distinctUntilChanged(),
  // 			tap(() => this.staffListLoading = true),
  // 			switchMap(term => this.staffProvider.search({ Take: 20, Skip: 0, IDDepartment: this.env.selectedBranchAndChildren, Term: term }).pipe(
  // 				catchError(() => of([])), // empty list on error
  // 				tap(() => this.staffListLoading = false)
  // 			))
  // 		)
  // 	);
  // }

  // contactList$
  // contactListLoading = false;
  // contactListInput$ = new Subject<string>();
  // contactListSelected = [];
  // contactSelected = null;
  // contactSearch() {
  // 	this.contactListLoading = false;
  // 	this.contactList$ = concat(
  // 		of(this.contactListSelected),
  // 		this.contactListInput$.pipe(
  // 			distinctUntilChanged(),
  // 			tap(() => this.contactListLoading = true),
  // 			switchMap(term => this.contactProvider.search({ Take: 20, Skip: 0, IDDepartment: this.env.selectedBranchAndChildren, Term: term }).pipe(
  // 				catchError(() => of([])), // empty list on error
  // 				tap(() => this.contactListLoading = false)
  // 			))
  // 		)
  // 	);
  // }

  emit(eventName, data) {
    this[eventName].emit(data);
  }

  saveChange(config) {
    if (!(config['Value'] == null || config['Value'] == 'null') && !config.__InheritedConfig) {
      config.__InheritedConfig = config._InheritedConfig;
      delete config._InheritedConfig;
    } else if ((config['Value'] == null || config['Value'] == 'null') && !config._InheritedConfig) {
      config._InheritedConfig = config.__InheritedConfig;
      delete config.__InheritedConfig;
    }

    return new Promise((resolve, reject) => {
      config.Value = JSON.stringify(config.ValueObject);
      this.pageProvider.save(config).then((resp) => {
        config.Id = resp['Id'];
        this.env.showTranslateMessage('Saving completed!', 'success');
        this.emit('savedConfig', this.configItems);
      });
    });
  }
}
