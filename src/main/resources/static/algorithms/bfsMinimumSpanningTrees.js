function minimumSpanningTrees(vertices, edges, accessor) {
    accessor = typeof accessor !== 'undefined' ? accessor : function(d) { return d };

    var span = [];

    // locate roots
    var roots = d3.set(vertices.map(accessor));
    for(var i = 0; i < edges.length; i++)
        roots.remove(edges[i].target);

    var edgesBySource = edges.reduce(
        function(acc, edge) {
            if(acc[edge.source])
                acc[edge.source].push(edge);
            else
                acc[edge.source] = [edge];
            return acc;
        }, {});

    var visited = d3.set();

    roots.forEach(function(root) {
       var queue = [];
       visited.add(root);
       queue.push(root);

       while(queue.length > 0) {
           var r = queue.shift();
           if(edgesBySource[r] == undefined)
               continue; // r is an isolated vertex

           for(var i = 0; i < edgesBySource[r].length; i++) {
               var edge = edgesBySource[r][i];
               if(!visited.has(edge.target)) {
                   span.push(edge);
                   queue.push(edge.target);
                   visited.add(edge.target);
               }
           }
       }
    });

    return span;
}