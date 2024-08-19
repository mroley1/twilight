import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-view',
  standalone: true,
  imports: [],
  templateUrl: './view.component.html',
  styleUrl: './view.component.scss'
})
export class ViewComponent {

  mapId:number|undefined
  
  @Input()
  set id(id: number) {
    this.mapId = id;
  }
}
