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
    
    // Path2D of area of dungeon
    private _areaPath: Path2D = new Path2D()
    // Path2D of each wall in dungeon
    private _wallsPaths: Path2D[] = []
    
    get areaPath() {
        return this._areaPath
    }
    
    get wallsPaths() {
        return this._wallsPaths
    }
    
    // sets the this._areaPath and this._wallsPaths variables based off of this._dungeonWalls and this._dungeonPath
    private refreshPaths() {
        this._areaPath = new Path2D([...this._dungeonPath.faces].reduce((acc, face) => acc + face.svg(), ""))
        this._wallsPaths = this._dungeonWalls.map((edge) => {
            const face = new Flatten.Face()
            face.append(edge)
            return new Path2D(face.svg())
        })
    }
    
    // add polygon to dungeon
    public addPolygon(polygon: Flatten.Polygon) {
        
        // point cloud of each place where new polygon walls intersect the existing dungeon
        const intersections = new PointCloud()
        this._dungeonWalls.forEach((wall) => {
            polygon.intersect(wall.shape).forEach((intersect) => {
                intersections.add(intersect)
            })
        })
        
        // array of each wall in new shape that are outside of the existing dungeon splitting as necessary
        let shapes: Flatten.AnyShape[] = []
        polygon.edges.forEach((edge: Flatten.Edge) => {
            intersections.splitShape(edge.shape).forEach((sliver) => {
                if (!this._dungeonPath.contains(sliver.middle())) {
                    shapes.push(sliver)
                }
            })
        })
        
        // remove any existing dungeon walls that are inside the new polygon splitting as necessary
        this._dungeonWalls = this._dungeonWalls.filter((wall) => {
            if (polygon.contains(wall.shape) && polygon.intersect(wall.shape).length == 0) {
                return false
            } else if (intersections.hits(wall)) {
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
        
        // add all new walls to dungeon
        shapes.forEach((shape) => {
            this._dungeonWalls.push(new Flatten.Edge(shape))
        })
        
        // ensure that new polygon is able to use boolean oporations and split into appropriate sub polygons
        const normalized = normalizePolygon(polygon)
        
        // add normalized polygons to dungeon
        normalized.forEach((poly) => {
            this._dungeonPath = Flatten.BooleanOperations.unify(this._dungeonPath, poly)
        })
        
        // refresh path objects
        this.refreshPaths()
    }
    
    public removePolygon(polygon: Flatten.Polygon) {
        
        // point cloud of each place where new polygon walls intersect the existing dungeon
        const intersections = new PointCloud()
        this._dungeonWalls.forEach((wall) => {
            polygon.intersect(wall.shape).forEach((intersect) => {
                intersections.add(intersect)
            })
        })
        
        // remove any walls that intersect with the new shape splitting where necesarry
        let shapes: Flatten.AnyShape[] = []
        this._dungeonWalls = this._dungeonWalls.filter((wall) => {
            if (polygon.contains(wall.shape) && polygon.intersect(wall.shape).length == 0) {
                return false
            } else if (intersections.hits(wall)) {
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
        
        // ensure that new polygon is able to use boolean oporations and split into appropriate sub polygons
        const normalized = normalizePolygon(polygon)
        
        // add normalized polygons to dungeon
        normalized.forEach((poly) => {
            this._dungeonPath = Flatten.BooleanOperations.subtract(this._dungeonPath, poly)
        })
        
        // add any walls that need to line the inside of the new cavity
        polygon.edges.forEach((edge: Flatten.Edge) => {
            intersections.splitShape(edge.shape).forEach((sliver) => {
                if (this._dungeonPath.contains(sliver.middle())) {
                    shapes.push(sliver)
                }
            })
        })
        
        // add new walls to the dungeon
        shapes.forEach((shape) => {
            this._dungeonWalls.push(new Flatten.Edge(shape))
        })
        
        // refresh path objects
        this.refreshPaths()
    }
    
    // add wall to dungeon internals
    public addEdge(edge: Flatten.Edge) {
        
        // all intersection points of the edge and the dungeon walls
        const intersections = new PointCloud(this._dungeonPath.intersect(edge.shape))
        
        // shapes of lines that fall inside of dungeon
        let shapes: Flatten.AnyShape[] = []
        intersections.splitShape(edge.shape).forEach((split) => {
            if (this._dungeonPath.contains(split.middle())) {
                shapes.push(split)
            }
        })
        
        // add lines to dungeon walls
        shapes.forEach((shape) => {
            this._dungeonWalls.push(new Flatten.Edge(shape))
        })
        
        // refresh path objects
        this.refreshPaths()
    }
}

function  normalizePolygon(polygon: Flatten.Polygon) {
    
    // point cload of all points that are vertecies or intersections
    const allPoints = new PointCloud()
    polygon.edges.forEach((edge) => {
        polygon.intersect(edge.shape).forEach((point) => {
            allPoints.add(point)
        })
    })
    
    // split polygon's edges around allPoints and store each edge
    let edges: Flatten.PolygonEdge[] = []
    polygon.edges.forEach((edge) => {
        allPoints.splitShape(edge.shape).forEach((split) => {
            edges.push(split)
        })
    })
    
    // used to store individual polygons
    let polygons: Flatten.Polygon[] = []
    
    // return string representation of a point
    function stringifyPoint(point: Flatten.Point) {
        return point.x + "," + point.y
    }
    
    // return string representation of an edge
    // simply a representation of the middle point which should be unique
    function stringifyEdge(edge: Flatten.Edge) {
        return stringifyPoint(edge.middle())
    }
    
    // maps the string representation of a point to the dges that lead away from that point
    const connections = new Map<string, Flatten.Edge[]>()
    allPoints.points.forEach((point) => 
        connections.set(stringifyPoint(point), edges.filter((edge) => 
            edge.start.equalTo(point)
        ))
    );
    
    // implementation of BFS that returns the shortest loop that this edge is a part of
    // @returns {(Flatten.Arc|Flatten.Segment)[]}
    function bfsLoop(startingEdge: Flatten.Edge) {
        const queue = [startingEdge]
        const parents = new Map<string, Flatten.Edge>()
        
        while (queue.length > 0) {
            const current = queue.shift()!;
            connections.get(stringifyPoint(current.end))?.forEach(neighbor => {
                if (!parents.has(stringifyEdge(neighbor))) {
                    parents.set(stringifyEdge(neighbor), current)
                    queue.push(neighbor)
                }
                
            })
        }
        
        const path: any[] = []
        let current: Flatten.Edge|undefined = startingEdge
        while (current) {
            const next: Flatten.Edge = parents.get(stringifyEdge(current))!
            current!.prev = next
            next.next = current!
            current = next
            path.push(current)
            if (stringifyEdge(next) == stringifyEdge(startingEdge)) {
                current = undefined;
            }
        }
        path.reverse()
        return path
    }
    
    // break polygon into uniqe loops of edges and form polygons around these
    while (edges.length > 0) {
        const polyEdges = bfsLoop(edges[0])
        
        let newPoly = new Flatten.Polygon(polyEdges as any)
        let a: number = 0
        newPoly.edges.forEach((edge: Flatten.PolygonEdge) => {
                a += edge.shape.tangentInEnd().angleTo(edge.next.shape.tangentInEnd()) - Math.PI
        })
        if (a > 0) {
            newPoly.reverse()
        }
        
        polygons.push(newPoly)
        
        polyEdges.forEach((polyEdge) => {
            edges = edges.filter((edge) => stringifyEdge(polyEdge) != stringifyEdge(edge))
        })
    }
    
    return polygons
}
