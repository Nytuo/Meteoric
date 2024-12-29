import {Component, Input, OnChanges, OnInit} from '@angular/core';
import {invoke} from "@tauri-apps/api/core";

@Component({
    selector: 'app-hltb',
    templateUrl: './hltb.component.html',
    styleUrl: './hltb.component.css'
})
export class HltbComponent implements OnInit, OnChanges {
    @Input() gameName: string | undefined;
    value = [
        {  time: '0m', icon: 'pi pi-book'},
        {  time: '0m', icon: 'pi pi-plus-circle'},
        {
            time: '0m',
            icon: 'pi pi-check-circle'
        },
        {time: '0m', icon: 'pi pi-th-large'}
    ];

    ngOnInit() {
        if (!this.gameName) {
            return;
        }
        this.fetchHLTBTimeForGame(this.gameName).then((response: any) => {
            let json = JSON.parse(response);
            let mainStory = json.main_story.average;
            let mainExtra = json.main_extra.average;
            let completionist = json.completionist.average;
            let allStyles = json.all_styles.average;
            this.value = [
                {
                    time: this.transformTime(mainStory),
                    icon: 'pi pi-book'
                },
                {
                    time: this.transformTime(mainExtra),
                    icon: 'pi pi-plus-circle'
                },
                {
                    time: this.transformTime(completionist),
                    icon: 'pi pi-check-circle'
                },
                {
                    time: this.transformTime(allStyles),
                    icon: 'pi pi-th-large'
                }
            ];
        }).catch((error: any) => {
            console.error(error);
        });

    }

    ngOnChanges() {
        if (!this.gameName) {
            return;
        }
        this.fetchHLTBTimeForGame(this.gameName).then((response: any) => {
            let json = JSON.parse(response);
            let mainStory = json.main_story.average;
            let mainExtra = json.main_extra.average;
            let completionist = json.completionist.average;
            let allStyles = json.all_styles.average;
            this.value = [
                {
                    time: this.transformTime(mainStory),
                    icon: 'pi pi-book'
                },
                {
                    time: this.transformTime(mainExtra),
                    icon: 'pi pi-plus-circle'
                },
                {
                    time: this.transformTime(completionist),
                    icon: 'pi pi-check-circle'
                },
                {
                    time: this.transformTime(allStyles),
                    icon: 'pi pi-th-large'
                }
            ];
        }).catch((error: any) => {
            console.error(error);
        });
    }

    transformTime(time: number) {
        let hours = Math.floor(time / 3600);
        let minutes = Math.floor((time % 3600) / 60);
        return hours + 'h ' + minutes + 'm';
    }

    async fetchHLTBTimeForGame(gameName: string) {
        return new Promise((resolve, reject) => {
            invoke('search_hltb', {gameName}).then((response) => {
                resolve(JSON.parse(response as string));
            }).catch((error) => {
                reject(error);
            });
        });
    }
}
