import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ShareModule } from 'src/app/share.module';
import { UserDetailPage } from './user-detail.page';

const routes: Routes = [
	{
		path: '',
		component: UserDetailPage,
	},
];

@NgModule({
	imports: [ShareModule, RouterModule.forChild(routes)],
	declarations: [UserDetailPage],
})
export class UserDetailPageModule {}
