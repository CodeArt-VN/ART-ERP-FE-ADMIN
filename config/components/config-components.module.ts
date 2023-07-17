import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ShareModule } from 'src/app/share.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DynamicConfigComponent } from './dynamic-config/dynamic-config.component';



@NgModule({
	imports: [IonicModule, 
		CommonModule, 
		FormsModule,
		ReactiveFormsModule,
		ShareModule, 
	],
	declarations: [
		DynamicConfigComponent,
	],
	exports: [
		DynamicConfigComponent
	],
})
export class ConfigComponentsModule { }
