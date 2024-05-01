import {Injectable} from '@angular/core';
import {BehaviorSubject} from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class GenericService {

    constructor() {
    }

    private zoom: BehaviorSubject<number> = new BehaviorSubject<number>(12);
    private gap: BehaviorSubject<number> = new BehaviorSubject<number>(20);

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
}
