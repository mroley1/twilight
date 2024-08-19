import { AfterViewInit, Component, ElementRef, Input, Signal, viewChild } from '@angular/core';
import { CanvasComponent } from "../canvas/canvas.component";

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [CanvasComponent],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.scss'
})
export class EditorComponent implements AfterViewInit {
  
  canvasComponentSignal: Signal<CanvasComponent> = viewChild.required('canvas')
  slateReferenceSignal: Signal<ElementRef<HTMLDivElement>> = viewChild.required('slate')
  mapId:number|undefined
  
  @Input()
  set id(id: number) {
    this.mapId = id;
  }
  
  ngAfterViewInit(): void {
    const slateElement = this.slateReferenceSignal().nativeElement
    const canvasComponent = this.canvasComponentSignal()
    function pointerdown() {
      slateElement.addEventListener("pointermove", pointermove)
    }
    function pointermove(event: PointerEvent) {
      canvasComponent.addOffest(event.movementX, event.movementY)
    }
    function pointerup() {
      slateElement.removeEventListener("pointermove", pointermove)
    }
    slateElement.addEventListener("pointerdown",pointerdown)
    slateElement.addEventListener("pointerup", pointerup)
    slateElement.addEventListener("pointercancel", pointerup)
    slateElement.addEventListener("pointerleave", pointerup)
  }
  
}
