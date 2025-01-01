import { AfterViewInit, Component, Input, Signal, viewChild } from '@angular/core';
import { CanvasComponent } from "../canvas/canvas.component";
import { EditorState, Move, Polygon, Rect, Wall } from './editorStates';
import { WebAssemblyLoaderService } from '../web-assembly-loader.service';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [CanvasComponent],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.scss'
})
export class EditorComponent {
  move = new Move
  rect = new Rect
  polygon = new Polygon
  wall = new Wall
  
  canvasComponentSignal: Signal<CanvasComponent> = viewChild.required('canvas')
  mapId:number|undefined
  
  editorState: EditorState = this.move
  
  webAssemblyLoaderService
  
  constructor(webAssemblyLoaderService: WebAssemblyLoaderService) {
    this.webAssemblyLoaderService = webAssemblyLoaderService
  }
  
  @Input()
  set id(id: number) {
    this.mapId = id;
  }
  
  public async receiveEvent(event: Event) {
    this.editorState.handleEvent(event, this.canvasComponentSignal())
    const {test, __getString: getString} = await this.webAssemblyLoaderService.instance
    console.log(getString(test(3)))
  }
  
  public setEditorState(editorState: EditorState) {
    this.editorState = editorState
    this.canvasComponentSignal().setPointerType(editorState.pointerType)
  }
  
}
