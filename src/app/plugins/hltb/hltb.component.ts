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
        {label: 'Main Story', color1: '#005f06', color2: '#96670a', value: 0, time: '0m', icon: 'pi pi-book'},
        {label: 'Main + Extra', color1: '#96670a', color2: '#60a5fa', value: 0, time: '0m', icon: 'pi pi-plus-circle'},
        {
            label: 'Completionist',
            color1: '#60a5fa',
            color2: '#60a5fa',
            value: 0,
            time: '0m',
            icon: 'pi pi-check-circle'
        },
        {label: 'All Styles', color1: '#c084fc', color2: '#c084fc', value: 0, time: '0m', icon: 'pi pi-th-large'}
    ];

    ngOnInit() {
        if (!this.gameName) {
            return;
        }
        this.fetchHLTBTimeForGame(this.gameName).then((response: any) => {
            let json = JSON.parse(response);
            console.log(json);
            let mainStory = json.main_story.average;
            let mainExtra = json.main_extra.average;
            let completionist = json.completionist.average;
            let allStyles = json.all_styles.average;
            let total = mainStory + mainExtra + completionist;
            let mainStoryPercentage = Math.round((mainStory / total) * 100);
            let mainExtraPercentage = Math.round((mainExtra / total) * 100);
            let completionistPercentage = Math.round((completionist / total) * 100);
            this.value = [
                {
                    label: 'Main Story',
                    color1: '#005f06',
                    color2: '#96670a',
                    value: mainStoryPercentage,
                    time: this.transformTime(mainStory),
                    icon: 'pi pi-book'
                },
                {
                    label: 'Main + Extra',
                    color1: '#96670a',
                    color2: '#60a5fa',
                    value: mainExtraPercentage,
                    time: this.transformTime(mainExtra),
                    icon: 'pi pi-plus-circle'
                },
                {
                    label: 'Completionist',
                    color1: '#60a5fa',
                    color2: '#60a5fa',
                    value: completionistPercentage,
                    time: this.transformTime(completionist),
                    icon: 'pi pi-check-circle'
                },
                {
                    label: 'All Styles',
                    color1: '#c084fc',
                    color2: '#c084fc',
                    value: 0,
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
            let mainStory = json.main_story;
            let mainExtra = json.main_extra;
            let completionist = json.completionist;
            let allStyles = json.all_styles;
            let total = mainStory + mainExtra + completionist;
            let mainStoryPercentage = Math.round((mainStory / total) * 100);
            let mainExtraPercentage = Math.round((mainExtra / total) * 100);
            let completionistPercentage = Math.round((completionist / total) * 100);
            this.value = [
                {
                    label: 'Main Story',
                    color1: '#005f06',
                    color2: '#96670a',
                    value: mainStoryPercentage,
                    time: this.transformTime(mainStory),
                    icon: 'pi pi-book'
                },
                {
                    label: 'Main + Extra',
                    color1: '#96670a',
                    color2: '#60a5fa',
                    value: mainExtraPercentage,
                    time: this.transformTime(mainExtra),
                    icon: 'pi pi-plus-circle'
                },
                {
                    label: 'Completionist',
                    color1: '#60a5fa',
                    color2: '#60a5fa',
                    value: completionistPercentage,
                    time: this.transformTime(completionist),
                    icon: 'pi pi-check-circle'
                },
                {
                    label: 'All Styles',
                    color1: '#c084fc',
                    color2: '#c084fc',
                    value: 0,
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
                resolve(response);
            }).catch((error) => {
                reject(error);
            });
        });
    }
}
