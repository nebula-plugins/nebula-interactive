describe('Prim\'s minimum spanning tree algorithm', function() {
    var edges = [
        edge(0,1),
        edge(0,2),
        edge(1,2),
        edge(2,3)
    ];

    it('Calculate the minimum spanning tree for uniform weighted graph', function() {
        var spanning = minimumSpanningTree(edges, 0,
            function(source, target) { return 1 });

        expect(spanning.length).toBe(3);
        expect(spanning).toContain(edge(0,1));
        expect(spanning).toContain(edge(0,2));
        expect(spanning).toContain(edge(2,3));
    });

    it('Calculate the minimum spanning tree for non-uniform weighted graph', function() {
        var spanning = minimumSpanningTree(edges, 0,
            function(source, target) { return (source == 0 && target == 2) ? 10 : 0 });

        expect(spanning.length).toBe(3);
        expect(spanning).toContain(edge(0,1));
        expect(spanning).toContain(edge(1,2));
        expect(spanning).toContain(edge(2,3));
    });

    it('Calculate the minimum spanning tree using the all-paths shortest matrix', function() {
        var distMatrix = shortestPaths([0,1,2,3], edges);

        var spanning = minimumSpanningTree(edges, 0, function(source, target) {
            return distMatrix.dist(0, target);
        });

        expect(spanning.length).toBe(3);
        expect(spanning).toContain(edge(0,1));
        expect(spanning).toContain(edge(0,2));
        expect(spanning).toContain(edge(2,3));
    });

    function edge(A, B) { return { source: A, target: B }; }
});