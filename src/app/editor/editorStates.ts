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
    handleEvent(event: PointerEvent, canvasComponent: CanvasComponent) {};
}

export class Polygon implements EditorState {
    name = "POLYGON"
    pointerType = PointerType.DEFAULT;
    handleEvent(event: PointerEvent, canvasComponent: CanvasComponent) {};
}

export class Wall implements EditorState {
    name = "WALL"
    pointerType = PointerType.DEFAULT;
    handleEvent(event: PointerEvent, canvasComponent: CanvasComponent) {};
}
