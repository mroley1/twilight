import { Routes } from '@angular/router';
import { EditorComponent } from './editor/editor.component';
import { ViewComponent } from './view/view.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { HomeComponent } from './home/home.component';
import { MapsComponent } from './maps/maps.component';

export const routes: Routes = [
    {path: '', component: HomeComponent},
    {path: 'maps', component: MapsComponent},
    {path: ':id/edit', component: EditorComponent},
    {path: ':id/view', component: ViewComponent},
    {path: '**', component: PageNotFoundComponent}
  ];