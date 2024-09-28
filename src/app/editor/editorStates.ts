import Flatten, { CircularLinkedList, LinkedListElement } from "@flatten-js/core";
import { CanvasComponent } from "../canvas/canvas.component";
import { PointerType } from "../canvas/pointerType";

export interface EditorState {
    name: string
    pointerType: PointerType
    handleEvent: (event: PointerEvent, canvasComponent: CanvasComponent) => void
}

export class Move implements EditorState {
    name = "MOVE";
    pointerType = PointerType.MOVE;
    private moving = false;
    handleEvent(event: PointerEvent, canvasComponent: CanvasComponent) {
        switch (event.type) {
            case "pointerdown":
                this.moving = true
                break;
            case "pointermove":
                if (this.moving) {
                    canvasComponent.addOffest(event.movementX, event.movementY)
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
    deleting = false
    finalRect: {startX: number, startY: number, endX: number, endY: number}|undefined
    handleEvent(event: PointerEvent, canvasComponent: CanvasComponent) {
        switch (event.type) {
            case "pointerdown":
                this.deleting = event.button == 2;
                this.startingPoint = {x: event.clientX, y: event.clientY}
                this.finalRect = canvasComponent.markupRectFromPoints(this.startingPoint.x, this.startingPoint.y, event.clientX, event.clientY, this.deleting)
                this.drawing = true
                break;
            case "pointermove":
                if (this.drawing) {
                    this.finalRect = canvasComponent.markupRectFromPoints(this.startingPoint.x, this.startingPoint.y, event.clientX, event.clientY, this.deleting)
                } else {
                    canvasComponent.markupRectFromPoints(event.clientX, event.clientY, event.clientX, event.clientY, this.deleting)
                }
                break;
            case "pointerup":
                this.drawing = false
                if (this.finalRect) {
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
                canvasComponent.clearMarkup()
                break;
            case "pointercancel":
                this.drawing = false
                canvasComponent.clearMarkup()
                break;
            case "pointerleave":
                this.drawing = false
                canvasComponent.clearMarkup()
                break;
        }
    };
}

export class Polygon implements EditorState {
    name = "POLYGON"
    pointerType = PointerType.DEFAULT;
    drawing = false;
    points: {x:number,y:number}[] = []
    handleEvent(event: PointerEvent, canvasComponent: CanvasComponent) {
        const boxX = canvasComponent.getNearestPointX(event.clientX)
        const boxY = canvasComponent.getNearestPointY(event.clientY)
        switch (event.type) {
            case "pointerdown":
                if (this.points.length != 0 && this.points[0].x == boxX && this.points[0].y == boxY) {
                    const polygon = new Flatten.Polygon()
                    let faces: Flatten.Segment[] = this.points.map((current, index, reference) => {
                        const next = reference[(index + 1) % reference.length]
                        return new Flatten.Segment(new Flatten.Point(current.x, current.y), new Flatten.Point(next.x, next.y))
                    })
                    polygon.addFace(faces)
                    console.log(polygon)
                    canvasComponent.addPathToDungeon(polygon)
                    this.drawing = false
                    this.points = []
                } else {
                    this.drawing = true
                    this.points.unshift({x: boxX, y: boxY})
                }
                break;
            case "pointermove":
                if (this.drawing) {
                    const copy = Array.from(this.points)
                    copy.push({x: boxX, y: boxY})
                    canvasComponent.markupPolygon(copy)
                } else {
                    canvasComponent.markupPoint(boxX, boxY)
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
    handleEvent(event: PointerEvent, canvasComponent: CanvasComponent) {
        switch (event.type) {
            case "pointerdown":
                this.startingPoint = {x: canvasComponent.getNearestPointX(event.clientX), y: canvasComponent.getNearestPointY(event.clientY)}
                this.drawing = true;
                break;
            case "pointermove":
                if (this.drawing) {
                    canvasComponent.markupLine(this.startingPoint.x, this.startingPoint.y, canvasComponent.getNearestPointX(event.clientX), canvasComponent.getNearestPointY(event.clientY))
                } else {
                    canvasComponent.markupPoint(canvasComponent.getNearestPointX(event.clientX), canvasComponent.getNearestPointY(event.clientY))
                }
                break;
            case "pointerup":
                canvasComponent.addWallToDungeon(this.startingPoint.x, this.startingPoint.y, canvasComponent.getNearestPointX(event.clientX), canvasComponent.getNearestPointY(event.clientY))
                this.drawing = false;
                break;
        }
    };
}
