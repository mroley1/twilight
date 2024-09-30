import Flatten from "@flatten-js/core";
import { CanvasComponent } from "../canvas/canvas.component";
import { PointerType } from "../canvas/pointerType";
import { MarkupTypes } from "../canvas/markupType";

export interface EditorState {
    name: string
    pointerType: PointerType
    handleEvent: (event: Event, canvasComponent: CanvasComponent) => void
}

export class Move implements EditorState {
    name = "MOVE";
    pointerType = PointerType.MOVE;
    private moving = false;
    handleEvent(event: Event, canvasComponent: CanvasComponent) {
        switch (event.type) {
            case "pointerdown":
                this.moving = true
                break;
            case "pointermove":
                var pointerEvent: PointerEvent = event as any
                if (this.moving) {
                    canvasComponent.addOffest(pointerEvent.movementX, pointerEvent.movementY)
                }
                break;
            case "pointerup":
                this.moving = false
                break;
            case "pointercancel":
                this.moving = false
                break;
            case "pointerleave":
                this.moving = false
                break;
        }
    };
}

export class Rect implements EditorState {
    name = "RECT"
    pointerType = PointerType.DEFAULT;
    drawing = false
    start: number|undefined
    startingPoint = {x: 0, y: 0}
    deleting = false;
    finalRect: {startX: number, startY: number, endX: number, endY: number}|undefined
    cancelDraw(canvasComponent: CanvasComponent) {
        this.drawing = false;
        canvasComponent.clearMarkup();
        canvasComponent.setMarkupType(MarkupTypes.DEFAULT);
    }
    handleEvent(event: Event, canvasComponent: CanvasComponent) {
        switch (event.type) {
            case "pointerdown":
                var pointerEvent: PointerEvent = event as any
                this.deleting = pointerEvent.button == 2;
                this.startingPoint = {x: pointerEvent.clientX, y: pointerEvent.clientY}
                canvasComponent.setMarkupType(this.deleting ? MarkupTypes.REMOVE : MarkupTypes.ADD)
                this.finalRect = canvasComponent.markupRectFromPoints(this.startingPoint.x, this.startingPoint.y, pointerEvent.clientX, pointerEvent.clientY)
                this.drawing = true
                break;
            case "pointermove":
                var pointerEvent: PointerEvent = event as any
                if (this.drawing) {
                    this.finalRect = canvasComponent.markupRectFromPoints(this.startingPoint.x, this.startingPoint.y, pointerEvent.clientX, pointerEvent.clientY)
                } else {
                    canvasComponent.markupRectFromPoints(pointerEvent.clientX, pointerEvent.clientY, pointerEvent.clientX, pointerEvent.clientY)
                }
                break;
            case "pointerup":
                if (this.drawing && this.finalRect) {
                    const polygon = new Flatten.Polygon(
                        new Flatten.Box(this.finalRect.startX, this.finalRect.startY, this.finalRect.endX, this.finalRect.endY)
                    )
                    if (this.deleting) {
                        canvasComponent.removePathFromDungeon(polygon)
                    } else {
                        canvasComponent.addPathToDungeon(polygon)
                    }
                    this.deleting = false
                    this.finalRect = undefined
                }
                this.cancelDraw(canvasComponent);
                break;
            case "pointercancel":
                this.cancelDraw(canvasComponent);
                break;
            case "pointerleave":
                this.cancelDraw(canvasComponent);
                break;
            case "keydown":
                var keyboardEvent: KeyboardEvent = event as any
                if (keyboardEvent.key == "Escape") {
                    this.cancelDraw(canvasComponent);
                }
                break;
        }
    };
}

export class Polygon implements EditorState {
    name = "POLYGON"
    pointerType = PointerType.DEFAULT;
    drawing = false;
    deleting = false;
    points: {x:number,y:number}[] = []
    cancelDraw(canvasComponent: CanvasComponent) {
        this.drawing = false;
        this.points = [];
        canvasComponent.clearMarkup();
        canvasComponent.setMarkupType(MarkupTypes.DEFAULT);
    }
    handleEvent(event: Event, canvasComponent: CanvasComponent) {
        switch (event.type) {
            case "pointerdown":
                var pointerEvent: PointerEvent = event as any
                var boxX = canvasComponent.getNearestPointX(pointerEvent.clientX)
                var boxY = canvasComponent.getNearestPointY(pointerEvent.clientY)
                if (this.points.length != 0 && this.points[0].x == boxX && this.points[0].y == boxY) {
                    if (this.points.length < 3) {
                        break;
                    }
                    const polygon = new Flatten.Polygon()
                    let faces: Flatten.Segment[] = this.points.map((current, index, reference) => {
                        const next = reference[(index + 1) % reference.length]
                        return new Flatten.Segment(new Flatten.Point(current.x, current.y), new Flatten.Point(next.x, next.y))
                    })
                    polygon.addFace(faces)
                    if (this.deleting) {
                        canvasComponent.removePathFromDungeon(polygon)
                    } else {
                        canvasComponent.addPathToDungeon(polygon)
                    }
                    this.cancelDraw(canvasComponent);
                } else {
                    if (!this.drawing) {
                        this.deleting = pointerEvent.button == 2;
                        canvasComponent.setMarkupType(this.deleting ? MarkupTypes.REMOVE : MarkupTypes.ADD);
                        this.drawing = true;
                    }
                    this.points.unshift({x: boxX, y: boxY});
                }
                break;
            case "pointermove":
                var pointerEvent: PointerEvent = event as any
                var boxX = canvasComponent.getNearestPointX(pointerEvent.clientX)
                var boxY = canvasComponent.getNearestPointY(pointerEvent.clientY)
                if (this.drawing) {
                    const copy = Array.from(this.points)
                    copy.push({x: boxX, y: boxY})
                    canvasComponent.markupPolygon(copy)
                } else {
                    canvasComponent.markupPoint(boxX, boxY)
                }
                break;
            case "keydown":
                var keyboardEvent: KeyboardEvent = event as any
                if (keyboardEvent.key == "Escape") {
                    this.cancelDraw(canvasComponent);
                }
                break;
        }
    };
}

export class Wall implements EditorState {
    name = "WALL"
    pointerType = PointerType.DEFAULT;
    drawing = false;
    startingPoint = {x: 0, y: 0};
    cancelDraw(canvasComponent: CanvasComponent) {
        this.drawing = false;
        canvasComponent.clearMarkup();
        canvasComponent.setMarkupType(MarkupTypes.DEFAULT);
    }
    handleEvent(event: Event, canvasComponent: CanvasComponent) {
        switch (event.type) {
            case "pointerdown":
                var pointerEvent: PointerEvent = event as any
                if (!this.drawing) {
                    this.startingPoint = {x: canvasComponent.getNearestPointX(pointerEvent.clientX), y: canvasComponent.getNearestPointY(pointerEvent.clientY)}
                    this.drawing = true;
                    canvasComponent.setMarkupType(MarkupTypes.BOLD);
                }
                break;
            case "pointermove":
                var pointerEvent: PointerEvent = event as any
                if (this.drawing) {
                    canvasComponent.markupLine(this.startingPoint.x, this.startingPoint.y, canvasComponent.getNearestPointX(pointerEvent.clientX), canvasComponent.getNearestPointY(pointerEvent.clientY))
                } else {
                    canvasComponent.markupPoint(canvasComponent.getNearestPointX(pointerEvent.clientX), canvasComponent.getNearestPointY(pointerEvent.clientY))
                }
                break;
            case "pointerup":
                var pointerEvent: PointerEvent = event as any
                const closestX = canvasComponent.getNearestPointX(pointerEvent.clientX);
                const closestY = canvasComponent.getNearestPointY(pointerEvent.clientY)
                if (this.drawing && (this.startingPoint.x != closestX || this.startingPoint.y != closestY)) {
                    canvasComponent.addWallToDungeon(this.startingPoint.x, this.startingPoint.y, closestX, closestY);
                    this.cancelDraw(canvasComponent)
                }
                break;
                case "keydown":
                    var keyboardEvent: KeyboardEvent = event as any
                    if (keyboardEvent.key == "Escape") {
                        this.cancelDraw(canvasComponent);
                    }
                    break;
        }
    };
}
