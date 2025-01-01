import {Component, Input} from '@angular/core';
import {ITrophy} from "../../../interfaces/IGame";
import {GenericService} from "../../services/generic.service";

@Component({
  selector: 'app-achievements',
  templateUrl: './achievements.component.html',
  styleUrl: './achievements.component.css'
})
export class AchievementsComponent {
  @Input() achievements!: ITrophy[];
  @Input() opened!: boolean;

  constructor(private genericService: GenericService) {
    console.log(this.achievements);
  }

  hide() {
    this.genericService.toggleAchievementsVisible();
  }
}
