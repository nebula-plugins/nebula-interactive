function minimumSpanningTree(edges, root, weightFunction) {
    var reached = d3.set();
    reached.add(root);

    var unreached = d3.set();
    for(var i = 0; i < edges.length; i++) {
        unreached.add(edges[i].source);
        unreached.add(edges[i].target);
    }
    unreached.remove(root);

    var span = [];

    while(!unreached.empty()) {
        var minEdgeWeight = Infinity;
        var minEdge;
        for(var i = 0; i < edges.length; i++) {
            if(!reached.has(edges[i].source) || reached.has(edges[i].target))
                continue;
            var weight = weightFunction(edges[i].source, edges[i].target);
            if(minEdgeWeight > weight) {
                minEdgeWeight = weight;
                minEdge = edges[i];
            }
        }

        reached.add(minEdge.target);
        unreached.remove(minEdge.target);

        span.push(minEdge);
    }

    return span;
}