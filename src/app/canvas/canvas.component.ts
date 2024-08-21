import { AfterViewInit, Component, ElementRef, HostListener, Signal, viewChild } from '@angular/core';

interface MarkupState {
  points: {x: number, y: number}[],
  rects: {startX: number, startY: number, endX: number, endY: number}[],
  polygons: {x: number, y: number}[][],
  lines: {startX: number, startY: number, endX: number, endY: number}[]
}

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
  
  private markupState: MarkupState = {
    points: [{x: -2, y: -2}, {x: -1, y: -1}, {x: 0, y: 0}],
    rects: [{startX: 1, startY: 1, endX: 2, endY: 2}],
    polygons: [[{x: -3, y: 1}, {x: -1, y: 3}, {x: -3, y: 3}]],
    lines: [{startX: 0, startY: -3, endX: 2, endY: -1}]
  }
  
  private offsetX = 0
  private offsetY = 0
  private scale = 0.2
  
  private canvasWidth = 0
  private canvasHeight = 0
  
  private TILE_SIZE = 300
  private halfTileSize = this.TILE_SIZE / 2
  
  private BG_COLOR = "grey"
  private MARKUP_FILL = "#2288"
  private MARKUP_STROKE = "#33F"
  
  @HostListener('window:resize')
  private setContextSize() {
    if (this.context) {
      const element = this.canvasReferenceSignal().nativeElement
      element.width = this.canvasWidth = window.innerWidth
      element.height = this.canvasHeight = window.innerHeight
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
  
  // translate coordinates from realtive to canvas units on x plane
  private tcX(coordinate: number) {
    return (coordinate * this.halfTileSize) + this.offsetX
  }
  
  // translate coordinates from realtive to canvas units on y plane
  private tcY(coordinate: number) {
    return (coordinate * this.halfTileSize) + this.offsetY
  }
  
  private draw() {
    if (!this.context) {
      return
    }
    this.context.resetTransform()
    this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeight)
    this.context.setTransform(this.scale, 0, 0, this.scale, this.canvasWidth / 2, this.canvasHeight / 2);
    
    this.drawGrid()
    
    this.drawMarkup()
  }
  
  private drawGrid() {
    if (!this.context) {
      return
    }
    const DOT_RADIUS = 10
    const patternElement = document.createElement('canvas')
    patternElement.width = this.TILE_SIZE;
    patternElement.height = this.TILE_SIZE;
    const patternContext = patternElement.getContext("2d")
    if (!patternContext) {return}
    patternContext.beginPath()
    patternContext.ellipse(this.halfTileSize, this.halfTileSize, DOT_RADIUS, DOT_RADIUS, 0, 0, 2 * Math.PI)
    patternContext.closePath()
    patternContext.fillStyle = this.BG_COLOR
    patternContext.fill()
    const pattern = this.context.createPattern(patternElement, null)
    if (pattern) {
      this.context.save()
      this.context.fillStyle = pattern
      this.context.translate(this.offsetX % this.TILE_SIZE, this.offsetY % this.TILE_SIZE)
      this.context.fillRect(-this.canvasWidth / (2 * this.scale) - this.TILE_SIZE, -this.canvasHeight / (2 * this.scale) - this.TILE_SIZE, (this.canvasWidth / this.scale) + (2 * this.TILE_SIZE), (this.canvasHeight / this.scale) + (2 * this.TILE_SIZE))
      this.context.restore()
    } else {
      console.error("could not create dot pattern")
    }
  }
  
  drawMarkup() {
    if (!this.context) {
      return
    }
    this.context.save()
    this.context.fillStyle = this.MARKUP_FILL
    this.context.lineWidth = 10;
    this.context.strokeStyle = this.MARKUP_STROKE
    this.markupState.points.forEach((point) => {
      this.context?.beginPath()
      this.context?.ellipse(this.tcX(point.x), this.tcY(point.y), 20, 20, 0, 0, Math.PI * 2)
      this.context?.closePath()
      this.context?.fill()
    })
    this.markupState.rects.forEach((rect) => {
      this.context?.beginPath()
      this.context?.rect(this.tcX(rect.startX), this.tcY(rect.startY), (rect.endX - rect.startX) * this.halfTileSize, (rect.endY - rect.startY) * this.halfTileSize)
      this.context?.closePath()
      this.context?.fill()
      this.context?.stroke()
    })
    this.markupState.polygons.forEach((polygon) => {
      this.context?.beginPath()
      polygon.forEach((line) => {
        this.context?.lineTo(this.tcX(line.x), this.tcY(line.y))
      })
      this.context?.closePath()
      this.context?.fill()
      this.context?.stroke()
    })
    this.markupState.lines.forEach((line) => {
      this.context?.beginPath()
      this.context?.moveTo(this.tcX(line.startX), this.tcY(line.startY))
      this.context?.lineTo(this.tcX(line.endX), this.tcY(line.endY))
      this.context?.closePath()
      this.context?.stroke()
    })
    this.context.restore()
  }
  
  public addOffest(x: number, y: number) {
    if (this.context) {
      this.offsetX += (x / this.scale);
      this.offsetY += (y / this.scale);
      this.draw();
    }
  }
  
  public addScale(ammount: number) {
    this.scale += ammount
    if (this.scale < 0.05) {
      this.scale = 0.05
    }
    this.draw()
  }
  
  public getNearestPointX(clientX: number): number {
    const canvasCoordinate = (clientX - this.canvasWidth / 2) / this.scale - this.offsetX
    return Math.round(canvasCoordinate / this.halfTileSize)
  }
  
  public getNearestPointY(clientY: number): number {
    const canvasCoordinate = (clientY - this.canvasHeight / 2) / this.scale - this.offsetY
    return Math.round(canvasCoordinate / this.halfTileSize)
  }
  
  public markupPoint(x: number, y: number) {
    this.markupState = {
      points: [{x, y}],
      rects: [],
      polygons: [],
      lines: []
    }
    this.draw()
  }

}
