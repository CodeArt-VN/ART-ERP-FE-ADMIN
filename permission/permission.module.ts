import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PermissionPage } from './permission.page';
import { ShareModule } from 'src/app/share.module';





import { FileUploadModule } from 'ng2-file-upload';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgOptionHighlightModule } from '@ng-select/ng-option-highlight';
import { NgxMaskModule, IConfig } from 'ngx-mask'


@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ShareModule,
    ReactiveFormsModule,
    FileUploadModule,
    NgSelectModule,
    NgOptionHighlightModule,
    NgxMaskModule.forRoot(),
    RouterModule.forChild([{ path: '', component: PermissionPage }])

  ],
  declarations: [PermissionPage]
})
export class PermissionPageModule {}
