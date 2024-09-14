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
    
    private _areaPath: Path2D = new Path2D()
    private _wallsPaths: Path2D[] = []
    
    get areaPath() {
        return this._areaPath
    }
    
    get wallsPaths() {
        return this._wallsPaths
    }
    
    private refreshPaths() {
        this._areaPath = new Path2D([...this._dungeonPath.faces].reduce((acc, face) => acc + face.svg(), ""))
        this._wallsPaths = this._dungeonWalls.map((edge) => {
            const face = new Flatten.Face()
            face.append(edge)
            return new Path2D(face.svg())
        })
    }
    
    public addPolygon(polygon: Flatten.Polygon) {
        
        const intersections = new PointCloud()
        
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
        
        this._dungeonWalls = this._dungeonWalls.filter((wall) => 
            !(polygon.contains(wall.shape) && polygon.intersect(wall.shape).length == 0)
        )
        
        shapes.forEach((shape) => {
            this._dungeonWalls.push(new Flatten.Edge(shape))
        })
        
        this._dungeonPath = Flatten.BooleanOperations.unify(this._dungeonPath, polygon)
        
        this.refreshPaths()
    }
    
    public removePolygon(polygon: Flatten.Polygon) {
        
        const intersections = new PointCloud()
        
        this._dungeonWalls.forEach((wall) => {
            polygon.intersect(wall.shape).forEach((intersect) => {
                intersections.add(intersect)
            })
        })
        
        let shapes: Flatten.AnyShape[] = []
        
        this._dungeonWalls = this._dungeonWalls.filter((wall) => {
            if (intersections.hits(wall)) {
                intersections.splitShape(wall.shape).forEach((split) => {
                    if (!polygon.contains(split.middle())) {
                        shapes.push(split)
                    }
                })
                return false
            } else {
                return true
            }
        })
        
        this._dungeonWalls = this._dungeonWalls.filter((wall) => 
            !(polygon.contains(wall.shape) && polygon.intersect(wall.shape).length == 0)
        )
        
        this._dungeonPath = Flatten.BooleanOperations.subtract(this._dungeonPath, polygon)
        
        polygon.edges.forEach((edge: Flatten.Edge) => {
            intersections.splitShape(edge.shape).forEach((sliver) => {
                if (this._dungeonPath.contains(sliver.middle())) {
                    shapes.push(sliver)
                }
            })
        })
        
        shapes.forEach((shape) => {
            this._dungeonWalls.push(new Flatten.Edge(shape))
        })
        
        this.refreshPaths()
    }
    
    public addEdge(edge: Flatten.Edge) {
        const intersections = new PointCloud(this._dungeonPath.intersect(edge.shape))
        
        let shapes: Flatten.AnyShape[] = []
        
        intersections.splitShape(edge.shape).forEach((split) => {
            if (this._dungeonPath.contains(split.middle())) {
                shapes.push(split)
            }
        })
        
        shapes.forEach((shape) => {
            this._dungeonWalls.push(new Flatten.Edge(shape))
        })
        
        this.refreshPaths()
    }
}