function shortestPaths(vertices, edges, accessor) {
    accessor = typeof accessor !== 'undefined' ? accessor : function(d) { return d };

    var dm = new function() { // the all pairs shortest path distance matrix
        var self = this;
        this.distMatrix = [];
        this.nextMatrix = [];
        this.max = 0;

        this.dist = function(v1, v2) {
            return self.distMatrix[[accessor(v1),accessor(v2)]]
        };

        this.set = function(v1, v2, val) {
            if(val > self.max && val != Infinity)
                self.max = val;
            self.distMatrix[[accessor(v1), accessor(v2)]] = val
        };

        this.setNext = function(v1, v2, v) {
            self.nextMatrix[[accessor(v1), accessor(v2)]] = v
        };

        this.next = function(v1, v2) {
            return self.nextMatrix[[accessor(v1), accessor(v2)]]
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
                dm.set(v1, v2, Infinity);
                dm.set(v2, v1, Infinity);
            }
        }
        dm.set(v1, v1, 0)
    }

    for(var i = 0; i < edges.length; i++) {
        var u = edges[i].source, v = edges[i].target;
        dm.set(u, v, 1);
        dm.setNext(u, v, v);
    }

    for(var k = 0; k < vertices.length; k++) {
        for(var i = 0; i < vertices.length; i++) {
            for(var j = 0; j < vertices.length; j++) {
                if(dist(i,j) > dist(i,k) + dist(k,j)) {
                    dm.set(vertices[i], vertices[j], dist(i,k) + dist(k,j));
                    dm.setNext(vertices[i], vertices[j], dm.next(vertices[i], vertices[k]));
                }
            }
        }
    }

    return dm;
}