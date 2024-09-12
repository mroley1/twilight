import Flatten from "@flatten-js/core"

class PointCloud {
    
    private _points: Flatten.Point[] = []
    get points(): Flatten.Point[] {
        return this._points
    }
    
    get length() {
        return this._points.length
    }
    
    constructor(points: Flatten.Point[] = []) {
        points.forEach((other)=>this.add(other))
    }
    
    public contains(point: Flatten.Point) {
        return this._points.some((other)=>point.equalTo(other));
    }
    
    public add(point: Flatten.Point) {
        if (!this.contains(point)) {
            this._points.push(point)
        }
    }
    
    public hits(shape: any) {
        return this._points.some((point)=>shape.contains(point))
    }
    
    public bridge(shape: any) {
        return this.contains(shape.start) && this.contains(shape.end)
    }
    
    public splitShape(shape: any) {
        let shapes: any[] = []
        const points: Flatten.Point[] = shape.sortPoints(this._points.filter((val) => shape.contains(val) && !(val.equalTo(shape.start) || val.equalTo(shape.end))))
        points.forEach((point, index) => {
            if (index == 0) {
                const split = shape.split(point)
                shape = split[1]
                shapes.push(split[0])
            } else {
                const split = shape.split(point)
                shape = split[1]
                shapes.push(split[0])
            }
        })
        shapes.push(shape)
        return shapes
    }
}

export class PathMaster {
    
    private _dungeonWalls: Flatten.Edge[] = []
    private _dungeonPath: Flatten.Polygon = new Flatten.Polygon()
    
    get dungeonPath() {
        return new Path2D([...this._dungeonPath.faces].reduce((acc, face) => acc + face.svg(), ""))
    }
    
    get dungeonWalls() {
        return this._dungeonWalls.map((edge) => {
            const face = new Flatten.Face()
            face.append(edge)
            return new Path2D(face.svg())
        })
    }
    
    public addPolygon(polygon: Flatten.Polygon) {
        
        const intersections = new PointCloud(this._dungeonPath.intersect(polygon))
        
        this._dungeonWalls.forEach((wall) => {
            polygon.intersect(wall.shape).forEach((intersect) => {
                intersections.add(intersect)
            })
        })
        
        let shapes: Flatten.AnyShape[] = []
        polygon.edges.forEach((edge: Flatten.Edge) => {
            intersections.splitShape(edge.shape).forEach((sliver) => {
                if (!this._dungeonPath.contains(sliver.middle())) {
                    shapes.push(sliver)
                }
            })
        })
        
        this._dungeonWalls = this._dungeonWalls.filter((wall) => {
            if (intersections.hits(wall)) {
                intersections.splitShape(wall.shape).forEach((split) => {
                    if (!polygon.contains(split.middle()) || polygon.findEdgeByPoint(split.middle())) {
                        shapes.push(split)
                    }
                })
                return false
            } else {
                return true
            }
        })
        
        shapes.forEach((shape) => {
            this._dungeonWalls.push(new Flatten.Edge(shape))
        })
        
        this._dungeonPath = Flatten.BooleanOperations.unify(this._dungeonPath, polygon)
    }
}