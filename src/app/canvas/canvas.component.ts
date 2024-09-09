import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Input, Output, Signal, viewChild } from '@angular/core';
import Flatten, { AnyShape, INSIDE } from '@flatten-js/core';
import { PointerType } from './pointerType';

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
  
  private markupState: MarkupState = {
    points: [{x: -2, y: -2}, {x: -1, y: -1}, {x: 0, y: 0}],
    rects: [{startX: 1, startY: 1, endX: 2, endY: 2}],
    polygons: [[{x: -4, y: 1}, {x: -1, y: 3}, {x: -3, y: 3}]],
    lines: [{startX: 0, startY: -3, endX: 2, endY: -1}]
  }
  private markupFill = "#000"
  private markupStroke = "#000"
  
  private dungeonWalls: Flatten.Edge[] = []
  private dungeonPath: Flatten.Polygon = new Flatten.Polygon()
  
  private offsetX = 0
  private offsetY = 0
  private scale = 0.2
  
  private canvasWidth = 0
  private canvasHeight = 0
  
  private TILE_SIZE = 300
  private halfTileSize = this.TILE_SIZE / 2
  
  private BG_COLOR = "grey"
  private MARKUP_ADD_FILL = "#2288"
  private MARKUP_DEL_FILL = "#8228"
  private MARKUP_ADD_STROKE = "#33F"
  private MARKUP_DEL_STROKE = "#F33"
  
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
  
  private removeDuplicatePoints(arr: Flatten.Point[]) {
    const empty: Flatten.Point[] = []
    return arr.reduce((acc, curr) => {
      let found = false
      acc.forEach((point) => {
        if (point.x == curr.x && point.y == curr.y) {
          found = true
        }
      })
      if (!found) {
        acc.push(curr)
      }
      return acc
    }, empty)
  }
  
  private arrayContainsPoint(arr: Flatten.Point[], pt: Flatten.Point) {
    return arr.reduce((_, curr) => {
      return curr.x == pt.x && curr.y == pt.y
    }, false)
  }
  
  private splitShapeByPoints(shape: any, pts: Flatten.Point[]) {
    let shapes: any[] = []
    let left: any
    pts.filter((val) => shape.contains(val) && !(val.equalTo(shape.start) || val.equalTo(shape.end)))
    pts.push(shape.end)
    pts.forEach((point, index) => {
      shapes.push()
      if (index == 0) {
        const split = shape.split(point)
        left = split[1]
        shapes.push(split[0])
      } else if (index == pts.length) {
        shapes.push(left)
      } else {
        const split = left.split(point)
        left = split[1]
        shapes.push(split[0])
      }
    })
    return shapes
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
    const path = new Path2D([...this.dungeonPath.faces].reduce((acc, face) => acc + face.svg(), ""))
    
    
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
    this.dungeonWalls.forEach((edge) => {
      const face = new Flatten.Face()
      face.append(edge)
      this.context?.stroke(new Path2D(face.svg()))
    })
    
    this.context.restore()
  }
  
  private drawMarkup() {
    if (!this.context) {
      return
    }
    this.context.save()
    this.context.fillStyle = this.markupFill
    this.context.lineWidth = 10;
    this.context.strokeStyle = this.markupStroke
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
    
    const debug = ["OUTSIDE", "INSIDE", "BOUNDARY", "CONTAINS", "INTERLACE"]
    newPoly.edges.forEach((edge: Flatten.Edge) => {
      let shapes: AnyShape[] = []
      if (edge.setInclusion(this.dungeonPath) == 0) {
        const shape = edge.shape
        const intersects = this.dungeonPath.intersect(shape)
        console.log(intersects)
        if (intersects.length == 0) {
          this.dungeonWalls.push(edge)
        }
        intersects.forEach((point) => {
          shape.split(point).forEach((split: any) => {
            if (split && !this.dungeonPath.contains(split) && this.removeDuplicatePoints(this.dungeonPath.intersect(split)).length <= 1) {
              shapes.push(split)
            }
          })
          if (true) {//})(!(point.equalTo(shape.start) || point.equalTo(shape.end))) {
            this.dungeonWalls = this.dungeonWalls.filter((wall) => {
              if (wall.contains(point)) {
                console.log(this.splitShapeByPoints(wall.shape, intersects))
                this.splitShapeByPoints(wall.shape, intersects).forEach((split: any) => {
                  if (split && !this.arrayContainsPoint(intersects, split.start) && !this.arrayContainsPoint(intersects, split.end)) {
                    shapes.push(split)
                  }
                })
                return false
              } else {
                return true
              }
            })
          }
        })
        shapes.forEach((shape) => {
          this.dungeonWalls.push(new Flatten.Edge(shape))
        })
      }
    })
    this.dungeonPath = Flatten.BooleanOperations.unify(this.dungeonPath, newPoly)
  }
  
  removePathFromDungeon(polygon: Flatten.Polygon) {
    this.dungeonPath = Flatten.BooleanOperations.subtract(this.dungeonPath, polygon.transform(new Flatten.Matrix(this.halfTileSize, 0, 0, this.halfTileSize, 0, 0)))
  }
  
  addWallToDungeon(startX: number, startY: number, endX: number, endY: number) {
    console.log(startX + " " + startY + " " + endX + " " + endY)
    const line = new Flatten.Line(new Flatten.Point(startX, startY), new Flatten.Point(endX, endY)).transform(new Flatten.Matrix(this.halfTileSize, 0, 0, this.halfTileSize, 0, 0))
    console.log(this.dungeonPath.splitToIslands())
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
  markupRectFromPoints(startX: number, startY: number, endX: number, endY: number, deleting: boolean) {
    const rect = {
      startX: Math.floor(this.tcbX(Math.min(startX, endX))),
      startY: Math.floor(this.tcbY(Math.min(startY, endY))),
      endX: Math.ceil(this.tcbX(Math.max(startX, endX))),
      endY: Math.ceil(this.tcbY(Math.max(startY, endY))),
    }
    this.markupFill = deleting ? this.MARKUP_DEL_FILL : this.MARKUP_ADD_FILL
    this.markupStroke = deleting ? this.MARKUP_DEL_STROKE : this.MARKUP_ADD_STROKE
    this.markupState = {
      points: [],
      rects: [rect],
      polygons: [],
      lines: []
    }
    this.draw()
    return rect
  }

}
