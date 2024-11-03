import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { SidebarComponent } from './Components/sidebar/sidebar.component';
import { TopbarComponent } from './Components/topbar/topbar.component';
import { CardViewComponent } from './Components/views/card-view/card-view.component';
import { BlockingOverlayComponent } from './Components/blocking-overlay/blocking-overlay.component';
import { EditGameComponent } from './Components/edit-game/edit-game.component';
import { SplashComponent } from './Components/splash/splash.component';
import { DisplaymanagerComponent } from './Components/displaymanager/displaymanager.component';
import { DetailsComponent } from './Components/details/details.component';
import { AddGameOverlayComponent } from './Components/add-game-overlay/add-game-overlay.component';

import { GameService } from './services/game.service';
import { CategoryService } from './services/category.service';
import { GenericService } from './services/generic.service';
import { DBService } from './services/db.service';
import { TauriService } from './services/tauri.service';

import {
	ConfirmationService,
	MessageService,
	PrimeNGConfig,
} from 'primeng/api';
import { ToastModule } from 'primeng/toast';

import { routes } from './app.routes';
import {CardComponent} from "./Components/card/card.component";
import {CSVExporter} from "./plugins/csv_exporter/csv_exporter.component";
import {ArchiveExporter} from "./plugins/archive_exporter/archive_exporter.component";
import {CSVImporter} from "./plugins/csv_importer/csv_importer.component";
import {EpicImporterComponent} from "./plugins/epic-importer/epic-importer.component";
import {FilterOverlayComponent} from "./Components/filter-overlay/filter-overlay.component";
import {YtdlComponent} from "./plugins/ytdl/ytdl.component";
import {SteamGridComponent} from "./plugins/steam_grid/steam_grid.component";
import {SteamImporterComponent} from "./plugins/steam-importer/steam-importer.component";
import {SettingsOverlayComponent} from "./Components/settings-overlay/settings-overlay.component";
import {ListViewComponent} from "./Components/views/listview/listview.component";
import {IGDBComponent} from "./plugins/igdb/igdb.component";
import {GogImporterComponent} from "./plugins/gog-importer/gog-importer.component";
import {DialogModule} from "primeng/dialog";
import {FloatLabelModule} from "primeng/floatlabel";
import {Button} from "primeng/button";
import {ProgressBarModule} from "primeng/progressbar";
import {NgOptimizedImage} from "@angular/common";
import {RatingModule} from "primeng/rating";
import {TagModule} from "primeng/tag";
import {FileUploadModule} from "primeng/fileupload";
import {DropdownModule} from "primeng/dropdown";
import {TableModule} from "primeng/table";
import {DividerModule} from "primeng/divider";
import {CarouselModule} from "primeng/carousel";
import {GalleriaModule} from "primeng/galleria";
import {SidebarModule} from "primeng/sidebar";
import {PanelMenuModule} from "primeng/panelmenu";
import {CheckboxModule} from "primeng/checkbox";
import {StepperModule} from "primeng/stepper";
import {ConfirmDialogModule} from "primeng/confirmdialog";
import {SelectButtonModule} from "primeng/selectbutton";
import {SliderModule} from "primeng/slider";
import {RadioButtonModule} from "primeng/radiobutton";
import {ListboxModule} from "primeng/listbox";
import {OverlayPanelModule} from "primeng/overlaypanel";
import {CascadeSelectModule} from "primeng/cascadeselect";

@NgModule({
	declarations: [
		AppComponent,
		SidebarComponent,
		TopbarComponent,
		CardViewComponent,
		BlockingOverlayComponent,
		EditGameComponent,
		SplashComponent,
		DisplaymanagerComponent,
		DetailsComponent,
		AddGameOverlayComponent,
		CardComponent,
		CSVExporter,
		ArchiveExporter,
		CSVImporter,
		EpicImporterComponent,
		FilterOverlayComponent,
		YtdlComponent,
		SteamGridComponent,
		SteamImporterComponent,
		SettingsOverlayComponent,
		ListViewComponent,
		IGDBComponent,
		GogImporterComponent
	],
	imports: [
		BrowserModule,
		RouterModule.forRoot(routes),
		HttpClientModule,
		FormsModule,
		ReactiveFormsModule,
		BrowserAnimationsModule,
		ToastModule,
		DialogModule,
		FloatLabelModule,
		Button,
		ProgressBarModule,
		NgOptimizedImage,
		RatingModule,
		TagModule,
		FileUploadModule,
		DropdownModule,
		TableModule,
		DividerModule,
		CarouselModule,
		GalleriaModule,
		SidebarModule,
		PanelMenuModule,
		CheckboxModule,
		StepperModule,
		ConfirmDialogModule,
		SelectButtonModule,
		SliderModule,
		RadioButtonModule,
		ListboxModule,
		OverlayPanelModule,
		CascadeSelectModule,
	],
	providers: [
		GameService,
		CategoryService,
		GenericService,
		DBService,
		TauriService,
		ConfirmationService,
		MessageService,
		PrimeNGConfig,
	],
	bootstrap: [AppComponent],
})
export class AppModule {}
