import {Component, OnDestroy, OnInit} from '@angular/core';
import {RouterLink} from "@angular/router";
import {NgForOf, NgIf} from "@angular/common";
import {CategoryService} from "../../services/category.service";

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [
        RouterLink,
        NgForOf,
        NgIf
    ],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit, OnDestroy {

    categories: any[] = [
    ];

    currentCategory = 0;

    ngOnInit() {
        this.categoryService.getCategories();
        this.categoryService.getCategoriesObservable().subscribe((categories) => {
            this.categories = categories;
            this.currentCategory = this.categoryService.getCurrentCategory();
        });
    }

    setCurrentCategory(id: number) {
        this.currentCategory = id;
        this.categoryService.setCurrentCategory(id);
    }



    ngOnDestroy() {

    }
    constructor(private categoryService: CategoryService) {
    }


}
