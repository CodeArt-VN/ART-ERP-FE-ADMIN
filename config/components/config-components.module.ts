import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ShareModule } from 'src/app/share.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgOptionHighlightModule } from '@ng-select/ng-option-highlight';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DynamicConfigComponent } from './dynamic-config/dynamic-config.component';
import { DynamicFormBuilderModule } from 'src/app/components/dynamic-field.module';



@NgModule({
	imports: [IonicModule, 
		CommonModule, 
		ShareModule, 
		NgSelectModule, 
		NgOptionHighlightModule,
		FormsModule,
		ReactiveFormsModule, 
		DynamicFormBuilderModule
	],
	declarations: [
		DynamicConfigComponent,
	],
	exports: [
		DynamicConfigComponent
	],
})
export class ConfigComponentsModule { }
