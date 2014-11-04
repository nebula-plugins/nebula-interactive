function shortestPaths(vertices, edges) {
    var dm = new function() { // the all pairs shortest path distance matrix
        var self = this;
        this.distMatrix = [];
        this.nextMatrix = [];
        this.max = 0;

        this.dist = function(v1, v2) {
            return self.distMatrix[[v1.index, v2.index]]
        };

        this.set = function(v1Index, v2Index, val) {
            if(val > self.max && val != Infinity)
                self.max = val;
            self.distMatrix[[v1Index, v2Index]] = val
        };

        this.setNext = function(v1Index, v2Index, v) {
            self.nextMatrix[[v1Index, v2Index]] = v
        };

        this.next = function(v1, v2) {
            return self.nextMatrix[[v1.index, v2.index]]
        };

        this.path = function(u, v) {
            if(!self.next(u,v)) return [];
            var path = [];
            for(; u != v; u = self.next(u,v))
                path.push(u);

            for(var i = 0; i < path.length; i++)
                path[i] = { source: path[i], target: i == path.length-1 ? v : path[i+1] };

            return path;
        }
    }();

    var dist = function(i,j) { return dm.dist(vertices[i], vertices[j]) };

    for(var i = 0; i < vertices.length; i++) {
        var v1 = vertices[i];
        for(var j = 0; j < vertices.length; j++) {
            var v2 = vertices[j];
            if(v1 != v2) {
                dm.set(v1.index, v2.index, Infinity);
                dm.set(v2.index, v1.index, Infinity);
            }
        }
        dm.set(v1.index, v1.index, 0)
    }

    for(var i = 0; i < edges.length; i++) {
        var u = edges[i].source, v = edges[i].target;
        dm.set(u, v, 1);

        for(var j = 0; j < vertices.length; j++)
            if(vertices[j].index == v)
               dm.setNext(u, v, vertices[j]);
    }

    for(var k = 0; k < vertices.length; k++) {
        for(var i = 0; i < vertices.length; i++) {
            for(var j = 0; j < vertices.length; j++) {
                if(dist(i,j) > dist(i,k) + dist(k,j)) {
                    dm.set(vertices[i].index, vertices[j].index, dist(i,k) + dist(k,j));
                    dm.setNext(vertices[i].index, vertices[j].index, dm.next(vertices[i], vertices[k]));
                }
            }
        }
    }

    return dm;
}
