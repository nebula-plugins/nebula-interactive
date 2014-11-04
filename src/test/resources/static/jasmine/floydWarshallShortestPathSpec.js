describe('Floyd-Warshall all pairs shortest path algorithm', function() {
    var A = {name: 'A', index: 0},
        B = {name: 'B', index: 1},
        C = {name: 'C', index: 2},
        D = {name: 'D', index: 3};

    it('Calculate the all pairs shortest matrix', function() {
        var distMatrix = buildMatrix(A, B, C, D);
        expect(distMatrix.dist(A, B)).toBe(1);
        expect(distMatrix.dist(A, C)).toBe(1);
        expect(distMatrix.dist(A, D)).toBe(2);
        expect(distMatrix.dist(B, A)).toBe(Infinity)
    });

    it('Calculate shortest path between two vertices', function() {
        var distMatrix = buildMatrix(A, B, C, D);
        var path = distMatrix.path(A, D);

        expect(path.length).toBe(2);
        expect(path[0].source).toBe(A);
        expect(path[0].target).toBe(C);
        expect(path[1].source).toBe(C);
        expect(path[1].target).toBe(D);

        path = distMatrix.path(A, A); // zero length path
        expect(path.length).toBe(0);

        path = distMatrix.path(B, A); // path does not exist
        expect(path.length).toBe(0);
    });

    function buildMatrix(A, B, C, D) {
        var vertices = [A,B,C,D];
        var edges = [
            {source: A.index, target: B.index},
            {source: A.index, target: C.index},
            {source: B.index, target: C.index},
            {source: C.index, target: D.index}
        ];

        return shortestPaths(vertices, edges);
    }
});
