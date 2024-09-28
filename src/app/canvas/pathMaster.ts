import Flatten, { AnyShape, Polygon, Vector } from "@flatten-js/core"

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
        
        const normalized = normalizePolygon(polygon)
        
        normalized.forEach((poly) => {
            this._dungeonPath = Flatten.BooleanOperations.unify(this._dungeonPath, poly)
        })
        
        this._dungeonPath.recreateFaces()
        
        //this._dungeonPath = Flatten.BooleanOperations.unify(this._dungeonPath, polygon)
        
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

function  normalizePolygon(polygon: Flatten.Polygon) {
    
    const originalPoints = new PointCloud(polygon.vertices)
    
    const allPoints = new PointCloud()
    polygon.edges.forEach((edge) => {
        polygon.intersect(edge.shape).forEach((point) => {
            allPoints.add(point)
        })
    })
    
    const edges: Flatten.PolygonEdge[] = []
    polygon.edges.forEach((edge) => {
        allPoints.splitShape(edge.shape).forEach((split) => {
            edges.push(split)
        })
    })
    
    // const pointMap = new Map<Flatten.Point, Flatten.Point[]>()
    // allPoints.points.forEach((point) => {
    //     const relevantPoints = edges
    //         .filter((edge) => edge.contains(point))
    //         .map((edge) => {
    //             if (edge.start.equalTo(point)) {
    //                 return edge.end
    //             } else {
    //                 return edge.start
    //             }
    //         })
    //     pointMap.set(point, relevantPoints)
    // });
    
    // pointMap.forEach((neighbors, point) => {
    //     if (neighbors.length != 2) {
    //         neighbors.forEach((pathPoint) => {
    //             let visited = new Set()
    //             visited.add(point)
    //             let queue = [point]
    //             while (queue.length) {
    //                 const current = queue.shift()
    //             }
    //         })
    //     }
    // })
    
    
    // intersections.forEach((apexPoint) => {
    //     const concerned = edges.filter((edge) => edge.contains(apexPoint))
    //     concerned.forEach((edge) => {
    //         if (edge.start.equalTo(apexPoint)) {
                
    //             function bfs() {}
                
    //             let point = edge.end
    //             let currentEdge = edge
                
    //         } else {
                
    //         }
    //     })
    //     console.log(concerned)
    // })
    
    
    // polygon.edges.forEach((edge) => {
    //     edge.shape.intersect(polygon).forEach((point: Flatten.Point) => {
    //         if (!original.contains(point)) {
    //             const newEdges = []
    //             let e
    //             let done = false
    //             while (!done) {
    //                 if (e == undefined) {
    //                     newEdges.push(edge.shape.split(point)[1])
    //                     e = edge.prev
    //                 } else if (intersections.hits(edge.shape)) {
    //                     newEdges.push(edge.shape.split(point)[0])
    //                     done = true
    //                 } else {
    //                     newEdges.push(edge.shape)
    //                     e = e.prev
    //                 }
    //                 console.log(e)
    //             }
    //             console.log(newEdges)
    //             const newPolygon = new Flatten.Polygon(newEdges)
    //             polygons.push(newPolygon)
    //         }
    //     })
    // })
    
    
    let polygons: Flatten.Polygon[] = []
    
    const intersections = allPoints.points.filter((point) => edges.filter((edge) => edge.contains(point)).length != 2)
    
    intersections.forEach((intersection) => {
        const multiline = new Flatten.Multiline([new Flatten.Segment(intersection, intersection)])
        polygon = polygon.cut(multiline) as unknown as Flatten.Polygon
    })
    
    // polygon.edges.forEach((edge) => {
    //     console.log(edge.box)
    // })
    
    // intersections.forEach((intersection) => {
    //     polygon
    // })
    
    // console.log(edges)
    // console.log(new Flatten.Polygon(edges.map((edge)=> edge.shape)))
    
    
    function toDeg(rad:number) {return rad * (180/Math.PI)}
    
    
    
    
    // polygon.edges.forEach((edge: Flatten.PolygonEdge) => {
    //     let closest = edge.next
    //     let closestAngle = 2 * Math.PI
    //     polygon.edges.hit(edge.end)
    //         .forEach((hitEdge: any) => {
    //             if (edge.shape.svg() == hitEdge.shape.svg()) {
    //                 return
    //             }
    //             let shape: Flatten.Segment|Flatten.Arc
    //             if (hitEdge.shape.end.equalTo(edge.shape.end)) {
    //                 shape = hitEdge.shape.reverse()
    //             } else {
    //                 shape = hitEdge.shape
    //             }
    //             console.log(toDeg(edge.shape.tangentInEnd().slope))
    //             console.log(toDeg(shape.tangentInStart().slope))
    //             const testAngle = edge.shape.tangentInEnd().angleTo(shape.tangentInStart())
    //             console.log(toDeg(testAngle))
    //             if (testAngle < closestAngle) {
    //                 closestAngle = testAngle
    //                 closest = hitEdge
    //             }
    //         }
    //     )
    //     console.log("final:", closestAngle * (180/Math.PI))
    //     console.log(closest)
    //     if (closest.end.equalTo(edge.end)) {
    //         closest.shape = closest.shape.reverse()
    //     }
    //     edge.next = closest
    //     closest.prev = edge
    // })
    
    
    // console.log(new Flatten.Vector(0, 1).invert())
    
    // console.log(toDeg(new Flatten.Vector(1, 0).angleTo(new Flatten.Vector(0, 1).invert())))
    // console.log(toDeg(new Flatten.Vector(1, 0).angleTo(new Flatten.Vector(0, -1))))
    // console.log(toDeg(new Flatten.Vector(-1, -1).angleTo(new Flatten.Vector(-1, 0))))
    // console.log(toDeg(new Flatten.Vector(-1, -1).angleTo(new Flatten.Vector(-1, 1))))
    
    // console.log(" ")
    
    // console.log(toDeg(new Flatten.Vector(1, 0).slope))
    // console.log(toDeg(new Flatten.Vector(-1, 0).slope))
    // console.log(toDeg(new Flatten.Vector(0, -1).slope))
    
    // console.log(" ")
    
    // console.log(toDeg(new Flatten.Vector(1, 0).slope - new Flatten.Vector(0, 1).slope))
    // console.log(toDeg(new Flatten.Vector(1, 0).slope - new Flatten.Vector(0, -1).slope))
    
    // polygon.recreateFaces()
    
    
    let a: number = 0
    polygon.edges.forEach((edge: Flatten.PolygonEdge) => {
            a += edge.shape.tangentInEnd().angleTo(edge.next.shape.tangentInEnd()) - Math.PI
    })
    if (a > 0) {
        polygon.reverse()
    }
    
    
    console.log(polygon)
    
    
    
    return [polygon]
}
