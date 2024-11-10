import { Routes } from '@angular/router';
import { DetailsComponent } from './components/details/details.component';
import { SplashComponent } from './components/splash/splash.component';
import { EditGameComponent } from './components/edit-game/edit-game.component';
import { DisplaymanagerComponent } from './components/displaymanager/displaymanager.component';

export const routes: Routes = [
	{
		path: '',
		component: SplashComponent,
	},
	{
		path: 'games',
		component: DisplaymanagerComponent,
	},
	{
		path: 'game/:id',
		component: DetailsComponent,
	},
	{
		path: 'edit/:id',
		component: EditGameComponent,
	},
];
