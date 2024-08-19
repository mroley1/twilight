import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.scss'
})
export class EditorComponent {
  
  mapId:number|undefined
  
  @Input()
  set id(id: number) {
    this.mapId = id;
  }
}
