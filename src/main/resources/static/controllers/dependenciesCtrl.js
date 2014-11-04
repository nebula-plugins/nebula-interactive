app.controller('DependenciesCtrl', function($scope, /*$cookies, */Restangular/*, hotkeys*/) {
    $scope.hideEvicted = true;
    $scope.artifactProperties = ['org', 'name', 'version'];
    $scope.ordering = 'name';
    $scope.reverse = false;

    var graph; // the set of nodes and links in the current visualization
    var linkSpan; // a spanning tree of the graph
    var edgesByTarget; // map of link target index to a set of edges inbound to that target
    var nodesByIndex;
    var root;
    var distMatrix; // all-paths shortest matrix by node index

    Restangular.one('dependencies').get().then(
        function(response) {
            $scope.graphElements = response.nodes;
            graph = response;
            root = graph.nodes[0];

            updateGraph();
        },
        function(error) {
            $scope.graphElements = null;
            $scope.errors = error.data.msg;
            if(error.status == 0) {
                $scope.errors = ["Unable to connect to dependency service.  Was Gradle terminated?"];
            }
        }
    );

    // ------------- Graph view -----------------------------
    var width = 1000, height = 500;
    var nodeRadius = 9;

    var color = d3.scale.category20();

    var force = cola.d3adaptor()
        .linkDistance(50)
        .size([width, height])
//        .symmetricDiffLinkLengths(100)
        .avoidOverlaps(true);

    var svg = d3.select("#graph").append("svg")
        .attr("width", width)
        .attr("height", height)
        .style("pointer-events", "all")
        .on("click", function() {
            $scope.graphSelected = null;
            $scope.$apply();
            tip.hide()
        });

    svg.append('rect')
        .attr('class', 'background')
        .attr('width', '100%')
        .attr('height', '100%')
        .call(d3.behavior.zoom().on("zoom", zoomed));

    var viewport = svg.append('g');

    svg.append('svg:defs').append('svg:marker')
        .attr('id', 'end-arrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('markerWidth', 3)
        .attr('markerHeight', 3)
        .attr('orient', 'auto')
      .append('svg:path')
        .attr("d", "M0,-5L10,0L0,5")
        .attr('stroke-width', '0px')
        .attr('fill', '#999');

    var lineFunction = d3.svg.line()
        .x(function (d) { return d.x })
        .y(function (d) { return d.y })
        .interpolate("linear");

    var colorByDistance = d3.scale.ordinal().domain([0,5]).range(colorbrewer.RdBu[6]);

    if(d3.tip != null) { // protect jasmine tests since d3-tip does not load correctly in jasmine
        var tip = d3.tip().attr('class', 'd3-tip').html(function(d) {
            return d.org + ':' + d.name + ':' + d.version + " (" + d.index + ")";
        });
        tip.offset([-20,0]);
        svg.call(tip);
    }

    var updateGraph = function() {
        // TODO why is RxNetty resorting my json output?!
        graph.nodes = graph.nodes.sort(function(a,b) { return a.index - b.index });

        linkSpan = minimumSpanningTrees(graph.nodes, graph.links, function(d) { return d.index });

        distMatrix = shortestPaths(graph.nodes, graph.links, function(d) { return d.index });

        edgesByTarget = graph.links.reduce(
            function(acc, edge) {
                if(!acc[edge.target]) acc[edge.target] = [];
                acc[edge.target].push({ source: edge.source, target: edge.target });
                return acc;
            }, {});

        force
          .nodes(graph.nodes)
          .links(linkSpan)
          .start(10,30,100);

        nodesByIndex = graph.nodes.reduce(
            function(acc, node) {
                acc[node.index] = node;
                return acc;
            }, {});

        var link = viewport.selectAll(".link")
          .data(linkSpan);

        link.enter().append("svg:path")
            .attr("class", "link")
            .attr("id", function(d) { return d.source.index + "_" + d.target.index });
        link.exit().remove();

        var edgeLabelText = viewport.selectAll(".edgeLabel")
            .data(linkSpan)
            .enter().append("svg:text")
            .attr("class", "edgeLabel");

        var edgeLabelPath = edgeLabelText.append("svg:textPath")
            .attr("text-anchor", "middle")
            .attr("xlink:href", function(d) { return "#" + d.source.index + "_" + d.target.index })
            .attr("startOffset", "60%");

        var node = viewport.selectAll(".node")
            .data(graph.nodes);

        node.enter().append("g")
            .attr("class", "node")
            .call(force.drag)
            .append("circle")
            .on("click", function(d) {
                d3.event.stopPropagation();
                $scope.graphSelected = d;
                $scope.$apply();
                focusOnNode(d, node, edgeLabelPath);
                focusOnPath(d, graph.nodes[0], link);
            })
            .on("mouseover", function(d) {
                $scope.graphSelected = null;
                $scope.$apply();
                tip.show(d);
            })
            .on("mouseout", function(d) {
                if(!$scope.graphSelected)
                    tip.hide();
            });

        node.selectAll(".hiddenEdgeMarkers").remove();

        var hiddenEdgeGroups = node.append("g").attr("class", "hiddenEdgeMarkers");
        hiddenEdgeGroups[0].forEach(function(hiddenEdgeGroup) {
            var inbound = edgesByTarget[hiddenEdgeGroup.__data__.index];

            if(hiddenEdgeGroup.__data__.index == 29)
                console.log(inbound);

            var hiddenEdgeCount = (inbound ? inbound.length : 1)-1;
            var anglePerEdge = hiddenEdgeCount == 1 ? 1 : 2*Math.PI/hiddenEdgeCount;

            for(var i = 0; i < hiddenEdgeCount; i++) {
                d3.select(hiddenEdgeGroup).append("circle")
                    .attr("cx", Math.cos(anglePerEdge*i-Math.PI/2) * (nodeRadius+3))
                    .attr("cy", Math.sin(anglePerEdge*i-Math.PI/2) * (nodeRadius+3))
                    .attr("r", 2);
            }
        });

        node.selectAll("circle")
            .style("fill", function(d) { return color(d['label']) })
            .style("stroke", function(d) { return d3.rgb(color(d['label'])).darker(2) })
            .style("stroke-width", function(d) { return d.index == 0 ? 4 : 2 })
            .attr("r", function(d) { return d.index == 0 ? nodeRadius + 5 : nodeRadius });

        node.selectAll(".hiddenEdgeMarkers").selectAll("circle")
            .style("fill", "black")
            .attr("r", 2);

        node.exit().remove();

        force.on("tick", function() {
            link.attr("d", function (d) {
                cola.vpsc.makeEdgeBetween(d, d.source.bounds, d.target.bounds, 16);
                return lineFunction([{ x: d.sourceIntersection.x, y: d.sourceIntersection.y }, { x: d.arrowStart.x, y: d.arrowStart.y }]);
            });
            if (isIE())
                link.each(function() { this.parentNode.insertBefore(this, this) });

            node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")" });

            repositionFirstOrderLinks();
        });

        focusOnNode(root, node, edgeLabelPath);
    };

    function zoomed() {
        viewport.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
        tip.hide();
    }

    function focusOnNode(focus, node, edgeLabelPath) {
        var nodeColor = function (d) {
            var dist = distMatrix.dist(focus, d);
            return d3.rgb(dist == Infinity ? '#666' : colorByDistance(Math.min(dist, 4)));
        };

        node.selectAll("circle")
            .transition()
            .style("fill", nodeColor)
            .style("stroke", function (d) {
                return nodeColor(d).darker(2)
            });

        edgeLabelPath.text(function (d) {
            var dist = distMatrix.dist(focus, d.source) + distMatrix.dist(d.source, d.target)
            return dist < Infinity ? dist : "";
        });

        var inbound = edgesByTarget[focus.index];

        var firstOrderLink = viewport.selectAll(".firstOrderLink")
            .data(inbound ? inbound : []);

        firstOrderLink
           .enter().append("svg:path")
           .attr("class", "firstOrderLink");

        repositionFirstOrderLinks();

        firstOrderLink.exit().remove();
    }

    function repositionFirstOrderLinks() {
        viewport.selectAll(".firstOrderLink")
            .attr("d", function (d) {
                cola.vpsc.makeEdgeBetween(d, nodesByIndex[d.source].bounds, nodesByIndex[d.target].bounds, 16);
                return lineFunction([
                    { x: d.sourceIntersection.x, y: d.sourceIntersection.y },
                    { x: d.arrowStart.x, y: d.arrowStart.y }
                ]);
            });
    }

    function focusOnPath(focus, root, link) {
        var shortestPath = distMatrix.path(root, focus);

        var inPath = function(d) {
            var intersection = shortestPath.filter(function(seg) {
                return seg.source.name == d.source.name && seg.target.name == d.target.name
            });
            return intersection.length > 0
        };

        link
            .style("stroke", function(d) { return inPath(d) ? 'magenta' : '#999' })
            .style("stroke-opacity", function(d) { return inPath(d) ? 1 : 0.6 });
    }

//    hotkeys.add({
//        combo: 'ctrl+c',
//        description: 'Copy the unique id of a selected graph vertex',
//        callback: function() {
//            console.log("copying!")
//        }
//    })
});
