import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterOutlet} from '@angular/router';
import {CardViewComponent} from "./Components/views/card-view/card-view.component";
import {GameService} from "./services/game.service";
import {SidebarComponent} from "./Components/sidebar/sidebar.component";
import {TopbarComponent} from "./Components/topbar/topbar.component";
import {CategoryService} from "./services/category.service";
import {GenericService} from "./services/generic.service";
import {LoadingBarComponent} from "./Components/loading-bar/loading-bar.component";
import {ConfirmationService, MessageService, PrimeNGConfig} from 'primeng/api';
import {ToastModule} from 'primeng/toast';
import {BlockingOverlayComponent} from "./Components/blocking-overlay/blocking-overlay.component";

@Component({
    selector: 'app-root',
    standalone: true,
    templateUrl: './app.component.html',
    styleUrl: './app.component.css',
    imports: [CommonModule, RouterOutlet, CardViewComponent, SidebarComponent, TopbarComponent, LoadingBarComponent, ToastModule, BlockingOverlayComponent],
    providers: [ConfirmationService, MessageService]

})
export class AppComponent implements OnInit {

    constructor(private gameService: GameService, private categoryService: CategoryService, private genericService: GenericService, private primengConfig: PrimeNGConfig) {
    }


    ngOnInit() {
        this.gameService.getGames();
        this.categoryService.refreshCategories();
        this.genericService.startRoutine();
        this.primengConfig.ripple = true;
    }

    closeOverlay() {
        let overlay = document.getElementById("overlay");
        console.log(overlay);
        if (overlay && overlay.style.display === "block") {
            overlay.style.display = "none";
        }
    }
}
