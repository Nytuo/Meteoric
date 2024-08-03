import {Routes} from "@angular/router";
import {CardListComponent} from "./Components/card-list/card-list.component";
import {DetailsComponent} from "./Components/details/details.component";
import {SplashComponent} from "./Components/splash/splash.component";
import {EditGameComponent} from "./Components/edit-game/edit-game.component";

export const routes: Routes = [
    {
        path: "",
        component: SplashComponent
    },
    {
        path: "games",
        component: CardListComponent
    },
    {
        path: "game/:id",
        component: DetailsComponent
    },
    {
        path: "edit/:id",
        component: EditGameComponent
    }
];
