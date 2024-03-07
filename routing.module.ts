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
  
];
