import { Routes } from '@angular/router';
import { AuthGuard } from 'src/app/guards/app.guard';

export const ADMINRoutes: Routes = [
  
  { path: 'form', loadChildren: () => import('./form/form.module').then(m => m.FormPageModule), canActivate: [AuthGuard] },
  { path: 'form/:id', loadChildren: () => import('./form-detail/form-detail.module').then(m => m.FormDetailPageModule), canActivate: [AuthGuard] },
  { path: 'permission', loadChildren: () => import('./permission/permission.module').then(m => m.PermissionPageModule), canActivate: [AuthGuard] },
  { path: 'config', loadChildren: () => import('./config/config.module').then(m => m.ConfigPageModule), canActivate: [AuthGuard] },
  { path: 'config/:segment/:id', loadChildren: () => import('./config/config.module').then(m => m.ConfigPageModule), canActivate: [AuthGuard] },
  { path: 'price-list', loadChildren: () => import('./price-list/price-list.module').then(m => m.PriceListPageModule), canActivate: [AuthGuard] },
  { path: 'price-list/:id', loadChildren: () => import('./price-list-detail/price-list-detail.module').then(m => m.PriceListDetailPageModule), canActivate: [AuthGuard] },
  { path: 'sync-job', loadChildren: () => import('./sync-job/sync-job.module').then(m => m.SyncJobPageModule), canActivate: [AuthGuard] },
  
  { path: 'help', loadChildren: () => import('./help/help.module').then(m => m.HelpPageModule), canActivate: [AuthGuard] },
  { path: 'help/:code', loadChildren: () => import('./help-detail/help-detail.module').then(m => m.HelpDetailPageModule), canActivate: [AuthGuard] },
  
  { path: 'form-permission', loadChildren: () => import('./form-permission/form-permission.module').then(m => m.FormPermissionPageModule), canActivate: [AuthGuard] },
  { path: 'translate', loadChildren: () => import('./translate/translate.module').then(m => m.TranslatePageModule), canActivate: [AuthGuard] },
  { path: 'user', loadChildren: () => import('./user/user.module').then(m => m.UserPageModule), canActivate: [AuthGuard] },
  { path: 'user/:id', loadChildren: () => import('./user-detail/user-detail.module').then(m => m.UserDetailPageModule), canActivate: [AuthGuard] },
  { path: 'user-group', loadChildren: () => import('./user-group/user-group.module').then(m => m.UserGroupPageModule), canActivate: [AuthGuard] },
  { path: 'user-group/:id', loadChildren: () => import('./user-group-detail/user-group-detail.module').then(m => m.UserGroupDetailPageModule), canActivate: [AuthGuard] },
  
  { path: 'config-grid', loadChildren: () => import('./config-grid/config-grid.module').then(m => m.ConfigGridPageModule), canActivate: [AuthGuard] },
  { path: 'printer', loadChildren: () => import('../ADMIN/printer/printer.module').then(m => m.PrinterPageModule), canActivate: [AuthGuard]  },
  { path: 'printer/:id', loadChildren: () => import('../ADMIN/printer-detail/printer-detail.module').then(m => m.PrinterDetailPageModule) , canActivate: [AuthGuard] },
  
];
