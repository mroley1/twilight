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
                    const path = `M ${this.finalRect.startX}, ${this.finalRect.startY}
                                  H ${this.finalRect.endX}
                                  V ${this.finalRect.endY}
                                  H ${this.finalRect.startX}
                                  V ${this.finalRect.startY}
                                  Z`.replaceAll(" ", "")
                    if (this.deleting) {
                        canvasComponent.removePathFromDungeon(path)
                    } else {
                        canvasComponent.addPathToDungeon(path)
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
    handleEvent(event: PointerEvent, canvasComponent: CanvasComponent) {};
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
                }
                else {
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
