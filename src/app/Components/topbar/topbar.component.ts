import {Component} from '@angular/core';
import {GenericService} from "../../services/generic.service";

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [],
    templateUrl: './topbar.component.html',
    styleUrl: './topbar.component.css'
})
export class TopbarComponent {

    constructor(protected genericService: GenericService) {
    }

    openOverlay(x: number, y: number) {
        let overlay = document.getElementById("overlay");
        console.log(overlay);
        if (overlay && overlay.style.display === "none") {
            overlay.style.display = "block";
            overlay.style.left = x + "px";
            overlay.style.top = y + "px";

        } else if (overlay && overlay.style.display === "block") {
            overlay.style.display = "none";
        }
    }

    changeZoom(zoom: EventTarget | null) {
        let zoomValue = (zoom as HTMLInputElement).value;
        this.genericService.changeZoom(parseInt(zoomValue));
    }


    changeGap(target: EventTarget | null) {
        let gapValue = (target as HTMLInputElement).value;
        this.genericService.changeGap(parseInt(gapValue));
    }
}
