import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PermissionPage } from './permission.page';
import { ShareModule } from 'src/app/share.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ShareModule,
    ReactiveFormsModule,
    RouterModule.forChild([{ path: '', component: PermissionPage }]),
  ],
  declarations: [PermissionPage],
})
export class PermissionPageModule {}
