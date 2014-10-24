describe('Floyd-Warshall all pairs shortest path algorithm', function() {
    it('Calculate the all pairs shortest matrix', function() {
        testDistance('A', 'B', 'C', 'D', function(d) { return d });
        testDistance({name: 'A'}, {name: 'B'}, {name: 'C'}, {name: 'D'}, function(d) { return d.name });
    });

    it('Calculate shortest path between two vertices', function() {
        var distMatrix = buildMatrix('A', 'B', 'C', 'D');
        var path = distMatrix.path('A', 'D');

        expect(path.length).toBe(2);
        expect(path[0].source).toBe('A');
        expect(path[0].target).toBe('C');
        expect(path[1].source).toBe('C');
        expect(path[1].target).toBe('D');

        path = distMatrix.path('A', 'A'); // zero length path
        expect(path.length).toBe(0);

        path = distMatrix.path('B', 'A'); // path does not exist
        expect(path.length).toBe(0)
    });

    function testDistance(A, B, C, D, accessor) {
        var distMatrix = buildMatrix(A, B, C, D, accessor);
        expect(distMatrix.dist(A,B)).toBe(1);
        expect(distMatrix.dist(A,C)).toBe(1);
        expect(distMatrix.dist(A,D)).toBe(2);
        expect(distMatrix.dist(B,A)).toBe(Infinity)
    }

    function buildMatrix(A, B, C, D, accessor) {
        var vertices = [A,B,C,D];
        var edges = [
            {source: A, target: B},
            {source: A, target: C},
            {source: B, target: C},
            {source: C, target: D}
        ];

        return shortestPaths(vertices, edges, accessor);
    }
});