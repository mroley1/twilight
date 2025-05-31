

// vector utilities
type Vector = {x: number, y: number}

function crossProduct(vector1: Vector, vector2: Vector): number {
    return (vector1.x * vector2.y) - (vector1.y * vector2.x);
}

function subtractPoints(point1: Point, point2: Point): Vector {
    return { x: point1.x - point2.x, y: point1.y - point2.y };
}

// bounding box
type BoundingBox = {
    t: number // top
    r: number // right
    b: number // bottom
    l: number // left
}

class Point {
    public x: number;
    public y: number;
    
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
    
    public distanceTo(otherPoint: Point): number {
        if (this === otherPoint) {return 0}
        return Math.sqrt((this.x - otherPoint.x)**2 - (this.y - otherPoint.y)**2)
    }
    
    public crossProduct(otherPoint: Point): number {
        return (this.x * otherPoint.y) - (this.y * otherPoint.x)
    }
}

class Span {
    
    public start: Point;
    public end: Point;
    
    constructor(start: Point, end: Point) {
        this.start = start;
        this.end = end;
    }
    
    get middle(): Point {
        const xMid = Math.min(this.start.x, this.end.x) + Math.abs(this.start.x - this.end.x)
        const yMid = Math.min(this.start.y, this.end.y) + Math.abs(this.start.y - this.end.y)
        return new Point(xMid, yMid);
    }
    
    get length(): number {
        return this.start.distanceTo(this.end)
    }
    
    public intersects(otherSpan: Span): Point|null {
        const thisDirectionVector = subtractPoints(this.end, this.start);
        const otherDirectionVector = subtractPoints(otherSpan.end, otherSpan.start);
        const deltaDirectionVector = subtractPoints(otherSpan.start, this.start);

        const denominator = crossProduct(thisDirectionVector, otherDirectionVector);
        const numerator1 = crossProduct(deltaDirectionVector, otherDirectionVector);
        const numerator2 = crossProduct(deltaDirectionVector, thisDirectionVector);

        if (denominator != 0) {
            let t = numerator1 / denominator;
            let u = numerator2 / denominator;

            if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
                return new Point(this.start.x + t * thisDirectionVector.x, this.start.y + t * thisDirectionVector.y)
            }
        }
        
        return null
    }
    
    public hitBy(point: Point): boolean {
        const startDelta = subtractPoints(point, this.start)
        const directionVector = subtractPoints(this.end, this.start)
        return crossProduct(startDelta, directionVector) == 0
    }
}

class Polygon {
    
    public points: Point[] = []
    public holes: Polygon[] = []
    
    constructor(points: Point[]|undefined, holes: Polygon[]|undefined) {
        if (points) this.points = points
        if (holes) this.holes = holes
    }
    
    get boundingBox(): BoundingBox|null {
        if (this.points.length > 0) {
            let maxX: number, minX: number
            maxX = minX = this.points[0].x
            let maxY: number, minY: number
            minX = minY = this.points[0].y
            this.points.forEach((point) => {
                maxX = Math.max(maxX, point.x)
                maxY = Math.max(maxY, point.y)
                minX = Math.min(minX, point.x)
                minY = Math.min(minY, point.y)
            })
        }
        return null
    }
    
    public near(otherPolygon: Polygon): boolean {
        const thisBox = this.boundingBox
        const otherBox = otherPolygon.boundingBox
        if (!thisBox || !otherBox) {
            return false;
        }
        return (
            (thisBox.t < otherBox.t && thisBox.t > otherBox.b && thisBox.l < otherBox.r && thisBox.l > otherBox.l)
         || (thisBox.t < otherBox.t && thisBox.t > otherBox.b && thisBox.r < otherBox.r && thisBox.r > otherBox.l)
         || (thisBox.b < otherBox.t && thisBox.b > otherBox.b && thisBox.l < otherBox.r && thisBox.l > otherBox.l)
         || (thisBox.b < otherBox.t && thisBox.b > otherBox.b && thisBox.r < otherBox.r && thisBox.r > otherBox.l)
        )
    }
    
    public booleanAdd(polygon: Polygon): Polygon[] {
        
        return []
    }
    
    public booleanSubtract(polygon: Polygon): Polygon[] {
        
        return []
    }
}

export class DungeonGeometry {
    
    
    private _walls: Span[] = [];
    
    constructor() {
        let s1 = new Span(new Point(-1, 0), new Point(1, 0))
        let s2 = new Span(new Point(1, 0), new Point(0, -1))
        console.log(s1.intersects(s2))
        
        console.log(s2.hitBy(new Point(0, 0))) // false
        console.log(s2.hitBy(new Point(1, 0))) // true
        console.log(s2.hitBy(new Point(0.5, -0.5))) // true 
        console.log(s2.hitBy(new Point(0.05, -0.05))) // false
    }
    
    public addPolygons(polygons: Polygon[]) {
        polygons.forEach((polygon) => {
            this.addPolygon(polygon);
        })
    }
    public removePolygons(polygons: Polygon[]) {
        polygons.forEach((polygon) => {
            this.removePolygon(polygon)
        })
    }
    
    private addPolygon(polygon: Polygon) {}
    private removePolygon(polygon: Polygon) {}
    
}