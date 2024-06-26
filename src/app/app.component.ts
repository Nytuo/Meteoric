import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { CardListComponent } from "./Components/card-list/card-list.component";
import { GameService } from "./services/game.service";
import { SidebarComponent } from "./Components/sidebar/sidebar.component";
import { TopbarComponent } from "./Components/topbar/topbar.component";
import { CategoryService } from "./services/category.service";
import { GenericService } from "./services/generic.service";
import { LoadingBarComponent } from "./Components/loading-bar/loading-bar.component";

@Component({
    selector: 'app-root',
    standalone: true,
    templateUrl: './app.component.html',
    styleUrl: './app.component.css',
    imports: [CommonModule, RouterOutlet, CardListComponent, SidebarComponent, TopbarComponent, LoadingBarComponent]
})
export class AppComponent {

    constructor(private gameService: GameService, private categroyService: CategoryService, private genericService: GenericService) {
        this.gameService.getGames();
        this.categroyService.refreshCategories();
        this.genericService.startRoutine();
    }

    closeOverlay() {
        let overlay = document.getElementById("overlay");
        console.log(overlay);
        if (overlay && overlay.style.display === "block") {
            overlay.style.display = "none";
        }
    }
}
