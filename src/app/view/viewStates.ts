import { CanvasComponent } from "../canvas/canvas.component";
import { PointerType } from "../canvas/pointerType";

export interface ViewState {
    name: string
    pointerType: PointerType
    handleEvent: (event: Event, canvasComponent: CanvasComponent) => void
}

export class Move implements ViewState {
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
