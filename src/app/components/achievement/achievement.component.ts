import {Component, Input} from '@angular/core';
import {ITrophy} from "../../../interfaces/IGame";

@Component({
  selector: 'app-achievement',
  templateUrl: './achievement.component.html',
  styleUrl: './achievement.component.css'
})
export class AchievementComponent {
  @Input() achievement!: ITrophy;

}
