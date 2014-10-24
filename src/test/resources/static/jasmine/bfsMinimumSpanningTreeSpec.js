describe('BFS minimum spanning trees algorithm', function() {
    it('Calculate the minimum spanning trees for a disconnected graph', function() {
        var edges = [
            edge(0,1),
            edge(0,2),
            edge(1,2),
            edge(2,3),

            edge(10,11)
        ];

        // note that 12 is an isolated vertex
        var spanning = minimumSpanningTrees([0,1,2,3,10,11,12], edges);

        expect(spanning.length).toBe(4);
        expect(spanning).toContain(edge(0,1));
        expect(spanning).toContain(edge(0,2));
        expect(spanning).toContain(edge(2,3));

        expect(spanning).toContain(edge(10,11));
    });

    function edge(A, B) { return { source: A, target: B }; }
});