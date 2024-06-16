import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterOutlet} from '@angular/router';
import {CardListComponent} from "./Components/card-list/card-list.component";
import {GameService} from "./services/game.service";
import {SidebarComponent} from "./Components/sidebar/sidebar.component";
import {TopbarComponent} from "./Components/topbar/topbar.component";
import {CategoryService} from "./services/category.service";
import {GenericService} from "./services/generic.service";

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [CommonModule, RouterOutlet, CardListComponent, SidebarComponent, TopbarComponent],
    templateUrl: './app.component.html',
    styleUrl: './app.component.css'
})
export class AppComponent {

    constructor(private gameService: GameService, private categroyService: CategoryService, private genericService: GenericService) {
        this.gameService.getGames();
        this.categroyService.refreshCategories();
    }

    closeOverlay() {
        let overlay = document.getElementById("overlay");
        console.log(overlay);
        if (overlay && overlay.style.display === "block") {
            overlay.style.display = "none";
        }
    }
}
