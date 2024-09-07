enum Type {
    POSITIVE,
    NEGATIVE
}

interface Transaction {
    type: Type
    path: string
}

export class PathMaster {
    
    private pathTransactions: Transaction[] = []
    private d: string = ""
    
    private rebuildD() {
         this.d = this.pathTransactions.reduce((prev, curr) => {
            if (prev.type == curr.type) {
                return {
                    type: curr.type,
                    path: prev.path + "Z" + curr.path
                }
            } else {
                return {
                    type: curr.type,
                    path: prev.path + curr.path
                }
            }
         }).path
    }
    
    public add(path: string) {
        this.pathTransactions.push({type: Type.POSITIVE, path})
        this.rebuildD()
    }
    
    public sub(path: string) {
        this.pathTransactions.push({type: Type.NEGATIVE, path})
        this.rebuildD()
    }
    
    public getPath() {
        return this.d;
    }
    
}