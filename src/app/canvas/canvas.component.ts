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
  private scale = 1
  
  private canvasWidth = 0
  private canvasHeight = 0
  
  private bgColor = "grey"
  
  private SCALE_FACTOR = 3
  
  @HostListener('window:resize')
  private setContextSize() {
    if (this.context) {
      const element = this.canvasReferenceSignal().nativeElement
      element.width = this.canvasWidth = window.innerWidth * this.SCALE_FACTOR
      element.height = this.canvasHeight = window.innerHeight * this.SCALE_FACTOR
      this.draw()
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
  }
  
  private draw() {
    if (!this.context) {
      return
    }
    this.context.resetTransform()
    this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeight)
    this.context.setTransform(this.scale, 0, 0, this.scale, this.canvasWidth / 2, this.canvasHeight / 2);
    
    this.drawGrid()
  }
  
  private drawGrid() {
    if (!this.context) {
      return
    }
    const TILE_SIZE = 300
    const DOT_RADIUS = 10
    const patternElement = document.createElement('canvas')
    patternElement.width = TILE_SIZE;
    patternElement.height = TILE_SIZE;
    const patternContext = patternElement.getContext("2d")
    if (!patternContext) {return}
    patternContext.beginPath()
    patternContext.ellipse(TILE_SIZE/2, TILE_SIZE/2, DOT_RADIUS, DOT_RADIUS, 0, 0, 2 * Math.PI)
    patternContext.closePath()
    patternContext.fillStyle = this.bgColor
    patternContext.fill()
    const pattern = this.context.createPattern(patternElement, null)
    this.context.save()
    this.context.fillStyle = pattern!
    this.context.translate(this.offsetX % TILE_SIZE, this.offsetY % TILE_SIZE)
    this.context.fillRect((-(this.canvasWidth * (1 / this.scale)) / 2) - TILE_SIZE, (-(this.canvasHeight * (1 / this.scale)) / 2) - TILE_SIZE, (this.canvasWidth * (1 / this.scale)) + (2 * TILE_SIZE), (this.canvasHeight * (1 / this.scale) + (2 * TILE_SIZE)))
    this.context.restore()
  }
  
  public addOffest(x: number, y: number) {
    if (this.context) {
      this.offsetX += (x / this.scale) * this.SCALE_FACTOR;
      this.offsetY += (y / this.scale) * this.SCALE_FACTOR;
      this.draw();
    }
  }
  
  public addScale(ammount: number) {
    if (this.scale <= 0.2 && ammount <= 0) {
      return
    }
    if (this.context) {
      this.scale += ammount
      this.draw();
    }
  }

}
