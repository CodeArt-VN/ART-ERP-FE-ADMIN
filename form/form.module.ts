import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormPage } from './form.page';
import { ShareModule } from 'src/app/share.module';
import { NgOptionHighlightModule } from '@ng-select/ng-option-highlight';

@NgModule({
	imports: [IonicModule, CommonModule, FormsModule, NgOptionHighlightModule, ShareModule, RouterModule.forChild([{ path: '', component: FormPage }])],
	declarations: [FormPage],
})
export class FormPageModule {}
