import {Routes} from "@angular/router";
import {DetailsComponent} from "./Components/details/details.component";
import {SplashComponent} from "./Components/splash/splash.component";
import {EditGameComponent} from "./Components/edit-game/edit-game.component";
import {DisplaymanagerComponent} from "./Components/displaymanager/displaymanager.component";

export const routes: Routes = [
    {
        path: "",
        component: SplashComponent
    },
    {
        path: "games",
        component: DisplaymanagerComponent
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
