import {Injectable} from '@angular/core';
import {BehaviorSubject} from "rxjs";
import {NavigationEnd, Router} from "@angular/router";
import {CategoryService} from "./category.service";

@Injectable({
    providedIn: 'root'
})
export class GenericService {

    constructor(protected router: Router) {
        this.router.events.subscribe((event) => {
            if (event instanceof NavigationEnd && this.isAuthorizedToBookmark) {
                this.changeDisplayBookmark(false);
            }
        });
    }

    isAuthorizedToBookmark = false;

    private zoom: BehaviorSubject<number> = new BehaviorSubject<number>(12);
    private gap: BehaviorSubject<number> = new BehaviorSubject<number>(1);
    private displayInfo: BehaviorSubject<any> = new BehaviorSubject<any>(null);
    private displayBookmark: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    changeZoom(zoom: number) {
        this.zoom.next(zoom);
    }

    getZoom() {
        return this.zoom.asObservable();
    }

    changeGap(gap: number) {
        this.gap.next(gap);
    }

    getGap() {
        return this.gap.asObservable();
    }

    getZoomValue() {
        return this.zoom.value;
    }

    getGapValue() {
        return this.gap.value;
    }

    changeDisplayInfo(displayInfo: any) {
        this.displayInfo.next(displayInfo);
    }

    getDisplayInfo() {
        return this.displayInfo.asObservable();
    }

    changeDisplayBookmark(displayBookmark: boolean) {
        this.displayBookmark.next(displayBookmark);
    }

    getDisplayBookmark() {
        return this.displayBookmark.asObservable();
    }
}
