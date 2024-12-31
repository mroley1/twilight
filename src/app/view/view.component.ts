import { Component, Input, Signal, viewChild } from '@angular/core';
import { CanvasComponent } from "../canvas/canvas.component";
import { PointerType } from '../canvas/pointerType';
import { Move, ViewState } from './viewStates';

@Component({
  selector: 'app-view',
  standalone: true,
  imports: [CanvasComponent],
  templateUrl: './view.component.html',
  styleUrl: './view.component.scss'
})
export class ViewComponent {
  move = new Move
  
  canvasComponentSignal: Signal<CanvasComponent> = viewChild.required('canvas')
  mapId:number|undefined
  
  viewState: ViewState = this.move
  
  @Input()
  set id(id: number) {
    this.mapId = id;
  }
  
  public receiveEvent(event: Event) {
    this.viewState.handleEvent(event, this.canvasComponentSignal())
  }
}
