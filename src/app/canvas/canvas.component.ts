import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Input, Output, Signal, viewChild } from '@angular/core';
import Flatten from '@flatten-js/core';
import { PointerType } from './pointerType';
import { PathMaster } from './pathMaster';
import { MarkupType, MarkupTypes } from './markupType';

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
  PointerType = PointerType
  
  @Output() events = new EventEmitter<PointerEvent>()
  
  @Input('pointerType') pointerType!: PointerType
  
  canvasReferenceSignal: Signal<ElementRef<HTMLCanvasElement>> = viewChild.required('canvas')
  slateReferenceSignal: Signal<ElementRef<HTMLDivElement>> = viewChild.required('slate')
  context: CanvasRenderingContext2D|undefined
  
  // private dungeonWalls: Flatten.Edge[] = []
  private dungeonStructure: PathMaster = new PathMaster() //Flatten.Polygon = new Flatten.Polygon()
  
  private offsetX = 0
  private offsetY = 0
  private scale = 0.2
  
  private canvasWidth = 0
  private canvasHeight = 0
  
  private TILE_SIZE = 300
  private halfTileSize = this.TILE_SIZE / 2
  
  private BG_COLOR = "grey"
  
  private markupType: MarkupType = MarkupTypes.DEFAULT
  private markupState: MarkupState = {
    points: [{x: -2, y: -2}, {x: -1, y: -1}, {x: 0, y: 0}],
    rects: [{startX: 1, startY: 1, endX: 2, endY: 2}],
    polygons: [[{x: -4, y: 1}, {x: -1, y: 3}, {x: -3, y: 3}]],
    lines: [{startX: 0, startY: -3, endX: 2, endY: -1}]
  }
  
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
    this.initListeners()
  }
  
  private initListeners() {
    const dispatchEvent = (event: PointerEvent) => {
      this.events.emit(event)
    }
    const slate = this.slateReferenceSignal().nativeElement
    slate.addEventListener("pointermove", dispatchEvent)
    slate.addEventListener("pointerdown", dispatchEvent)
    slate.addEventListener("pointerup", dispatchEvent)
    slate.addEventListener("pointercancel", dispatchEvent)
    slate.addEventListener("pointerleave", dispatchEvent)
    const wheel = (event: WheelEvent) => {
        this.addScale(event.deltaY / (window.innerHeight * -4))
      }
    slate.addEventListener("wheel", wheel)
    slate.addEventListener("contextmenu", (e) => {
      e.preventDefault()
    })
  }
  
  setPointerType(pointerType: PointerType) {
    this.pointerType = pointerType
  }
  
  // translate coordinates from block to canvas units on x plane
  private tcX(coordinate: number) {
    return (coordinate * this.halfTileSize) + this.offsetX
  }
  
  // translate coordinates from block to canvas units on y plane
  private tcY(coordinate: number) {
    return (coordinate * this.halfTileSize) + this.offsetY
  }
  
  // translate coordinates from client to block units on x plane
  private tcbX(clientX: number) {
    return ((clientX - this.canvasWidth / 2) / this.scale - this.offsetX) / this.halfTileSize
  }
  
  // translate coordinates from client to block units on y plane
  private tcbY(clientY: number) {
    return ((clientY - this.canvasHeight / 2) / this.scale - this.offsetY) / this.halfTileSize
  }
  
  private draw() {
    if (!this.context) {
      return
    }
    this.context.resetTransform()
    this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeight)
    this.context.setTransform(this.scale, 0, 0, this.scale, this.canvasWidth / 2, this.canvasHeight / 2);
    
    this.drawDots()
    this.drawDungeon()
    this.drawMarkup()
  }
  
  private drawDots() {
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
  
  private drawDungeon() {
    if (!this.context) {
      return
    }
    this.context.save()
    this.context.setTransform(this.scale, 0, 0, this.scale, (this.canvasWidth / 2) + (this.offsetX * this.scale), (this.canvasHeight / 2) + (this.offsetY * this.scale))
    this.context.lineWidth = 20
    const path = this.dungeonStructure.areaPath
    
    const patternElement = document.createElement('canvas')
    patternElement.width = this.TILE_SIZE;
    patternElement.height = this.TILE_SIZE;
    const patternContext = patternElement.getContext("2d")
    if (!patternContext) {return}
    patternContext.fillStyle = "antiquewhite"
    patternContext.fillRect(0, 0, this.TILE_SIZE, this.TILE_SIZE)
    patternContext.beginPath()
    patternContext.moveTo(this.halfTileSize, 0)
    patternContext.lineTo(this.halfTileSize, this.TILE_SIZE)
    patternContext.moveTo(0, this.halfTileSize)
    patternContext.lineTo(this.TILE_SIZE, this.halfTileSize)
    patternContext.closePath()
    patternContext.strokeStyle = "#00000080"
    patternContext.lineWidth = 5;
    patternContext.stroke()
    const pattern = this.context.createPattern(patternElement, null)
    if (pattern) {
      this.context.fillStyle = pattern
      this.context.fill(path)
    } else {
      console.error("could not create dot pattern")
    }
    this.dungeonStructure.wallsPaths.forEach((wall) => {
      this.context?.stroke(wall)
    })
    
    this.context.restore()
  }
  
  private drawMarkup() {
    if (!this.context) {
      return
    }
    this.context.save()
    this.context.fillStyle = this.markupType.fill
    this.context.lineWidth = 10;
    this.context.strokeStyle = this.markupType.stroke
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
  
  addPathToDungeon(polygon: Flatten.Polygon) {
    const newPoly = polygon.transform(new Flatten.Matrix(this.halfTileSize, 0, 0, this.halfTileSize, 0, 0))
    this.dungeonStructure.addPolygon(newPoly)
    this.draw()
  }
  
  removePathFromDungeon(polygon: Flatten.Polygon) {
    const newPoly = polygon.transform(new Flatten.Matrix(this.halfTileSize, 0, 0, this.halfTileSize, 0, 0))
    this.dungeonStructure.removePolygon(newPoly)
    this.draw()
  }
  
  addWallToDungeon(startX: number, startY: number, endX: number, endY: number) {
    const line = new Flatten.Segment(new Flatten.Point(startX, startY), new Flatten.Point(endX, endY)).transform(new Flatten.Matrix(this.halfTileSize, 0, 0, this.halfTileSize, 0, 0))
    this.dungeonStructure.addEdge(new Flatten.Edge(line))
    this.draw()
  }
  
  public clearMarkup() {
    this.markupState = {
      points: [],
      rects: [],
      polygons: [],
      lines: []
    }
    this.draw()
  }
  
  // based on grid coordinates
  public markupPoint(x: number, y: number) {
    this.markupState = {
      points: [{x, y}],
      rects: [],
      polygons: [],
      lines: []
    }
    this.draw()
  }
  
  // based on grid coordinates
  public markupLine(startX: number, startY: number, endX: number, endY: number) {
    this.markupState = {
      points: [],
      rects: [],
      polygons: [],
      lines: [{startX, startY, endX, endY}]
    }
    this.draw()
  }
  
  // based on client coordinates
  markupRectFromPoints(startX: number, startY: number, endX: number, endY: number) {
    const rect = {
      startX: Math.floor(this.tcbX(Math.min(startX, endX))),
      startY: Math.floor(this.tcbY(Math.min(startY, endY))),
      endX: Math.ceil(this.tcbX(Math.max(startX, endX))),
      endY: Math.ceil(this.tcbY(Math.max(startY, endY))),
    }
    if (rect.startX == rect.endX) {
      rect.endX += 1
    }
    if (rect.startY == rect.endY) {
      rect.endY += 1
    }
    this.markupState = {
      points: [],
      rects: [rect],
      polygons: [],
      lines: []
    }
    this.draw()
    return rect
  }
  
  markupPolygon(points: {x:number, y:number}[]) {
    this.markupState = {
      points: [],
      rects: [],
      polygons: [points],
      lines: []
    }
    this.draw()
  }
  
  setMarkupType(markupType: MarkupType) {
    this.markupType = markupType
  }

}
