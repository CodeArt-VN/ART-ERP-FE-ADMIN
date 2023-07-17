import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ConfigPage } from './config.page';
import { ShareModule } from 'src/app/share.module';
import { FileUploadModule } from 'ng2-file-upload';;
import { ConfigComponentsModule } from './components/config-components.module';


const routes: Routes = [{ path: '', component: ConfigPage }];

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ShareModule,
    ConfigComponentsModule,
    ReactiveFormsModule,
    FileUploadModule,
    RouterModule.forChild(routes)
  ],
  declarations: [ConfigPage]
})
export class ConfigPageModule { }
