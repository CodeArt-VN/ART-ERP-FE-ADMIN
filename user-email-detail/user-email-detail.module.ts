import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { UserEmailDetailPage } from './user-email-detail.page';
import { ShareModule } from 'src/app/share.module';

const routes: Routes = [
	{
		path: '',
		component: UserEmailDetailPage,
	},
];

@NgModule({
	imports: [CommonModule, FormsModule, ShareModule, IonicModule, ReactiveFormsModule, ShareModule, RouterModule.forChild(routes)],
	declarations: [UserEmailDetailPage],
})
export class UserEmailDetailPageModule {}
