import { AfterViewInit, Component, ElementRef, HostListener, Signal, viewChild } from '@angular/core';

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [],
  templateUrl: './canvas.component.html',
  styleUrl: './canvas.component.scss'
})
export class CanvasComponent implements AfterViewInit {
  
  canvasReferenceSignal: Signal<ElementRef<HTMLCanvasElement>> = viewChild.required('canvas')
  context: CanvasRenderingContext2D|undefined
  
  private offsetX = 0
  private offsetY = 0
  
  private canvasWidth = 0
  private canvasHeight = 0
  
  @HostListener('window:resize')
  private setContextSize() {
    if (this.context) {
      const element = this.canvasReferenceSignal().nativeElement
      element.width = this.canvasWidth = window.innerWidth
      element.height = this.canvasHeight = window.innerHeight
    }
  }
  
  ngAfterViewInit(): void {
    const canvasContext = this.canvasReferenceSignal().nativeElement.getContext("2d")
    if (!canvasContext) {
      console.error("could not find drawing canvas")
      return
    }
    this.context = canvasContext
    this.setContextSize()
    this.draw()
  }
  
  private draw() {
    if (!this.context) {
      return
    }
    this.context.clearRect(-this.offsetX, -this.offsetY, this.canvasWidth, this.canvasHeight)
    this.context.beginPath();
    this.context.moveTo(75, 50);
    this.context.lineTo(100, 75);
    this.context.lineTo(100, 25);
    this.context.fill();
  }
  
  public addOffest(x: number, y: number) {
    this.offsetX += x;
    this.offsetY += y;
    if (this.context) {
      this.context.translate(x, y);
      this.draw()
    }
  }

}
