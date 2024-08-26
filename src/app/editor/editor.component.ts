import { AfterViewInit, Component, Input, Signal, viewChild } from '@angular/core';
import { CanvasComponent } from "../canvas/canvas.component";
import { EditorState, Move, Polygon, Rect, Wall } from './editorStates';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [CanvasComponent],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.scss'
})
export class EditorComponent implements AfterViewInit {
  move = new Move
  rect = new Rect
  polygon = new Polygon
  wall = new Wall
  
  canvasComponentSignal: Signal<CanvasComponent> = viewChild.required('canvas')
  mapId:number|undefined
  
  editorState: EditorState = this.move
  
  @Input()
  set id(id: number) {
    this.mapId = id;
  }
  
  ngAfterViewInit(): void {
    // const slateElement = this.slateReferenceSignal().nativeElement
    // const canvasComponent = this.canvasComponentSignal()
    // function pointerdown() {
    //   slateElement.addEventListener("pointermove", pointermove)
    // }
    // function pointermove(event: PointerEvent) {
    //   event.preventDefault()
    //   canvasComponent.addOffest(event.movementX, event.movementY)
    // }
    // function pointerup() {
    //   slateElement.removeEventListener("pointermove", pointermove)
    // }
    // slateElement.addEventListener("pointerdown", pointerdown)
    // slateElement.addEventListener("pointerup", pointerup)
    // slateElement.addEventListener("pointercancel", pointerup)
    // slateElement.addEventListener("pointerleave", pointerup)
    // function wheel(event: WheelEvent) {
    //   canvasComponent.addScale(event.deltaY / (window.innerHeight * 4))
    // }
    // slateElement.addEventListener("wheel", wheel)
    
    // slateElement.addEventListener("pointermove", (event) => {
    //   event.preventDefault()
    //   canvasComponent.markupPoint(canvasComponent.getNearestPointX(event.clientX), canvasComponent.getNearestPointY(event.clientY))
    // })
  }
  
  public receiveEvent(event: PointerEvent) {
    this.editorState.handleEvent(event, this.canvasComponentSignal())
  }
  
  public setEditorState(editorState: EditorState) {
    this.editorState = editorState
    this.canvasComponentSignal().setPointerType(editorState.pointerType)
  }
  
}
