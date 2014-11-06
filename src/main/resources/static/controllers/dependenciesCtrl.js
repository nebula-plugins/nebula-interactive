app.controller('DependenciesCtrl', function($scope, Restangular) {
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

            updateSearchSuggestions();
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
    var width = 1400, height = 800;
    var nodeRadius = 9;

    var force = cola.d3adaptor()
        .linkDistance(50)
        .size([width, height])
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

    var zoom = d3.behavior.zoom();

    svg.append('rect')
        .attr('class', 'background')
        .attr('width', '100%')
        .attr('height', '100%')
        .call(zoom.on("zoom", function() { zoomed(d3.event.translate, d3.event.scale) }));

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
            return d.org + ':' + d.name + ':' + d.version;
        });
        tip.offset([-10,0]);
        svg.call(tip);
    }

    /**
     * Autocompletion suggestions on all module names in the graph
     */
    function updateSearchSuggestions() {
        var moduleMatcher = function(nodes) {
            return function findMatches(q, cb) {
                var matches = [];
                var substrRegex = new RegExp(q, 'i');
                nodes.forEach(function(node) {
                    if (substrRegex.test(node.name))
                        matches.push(node);
                });
                cb(matches);
            };
        };

        var search = $('#search');
        search.typeahead({ highlight: true },
            {
                name: 'modules',
                displayKey: 'name',
                source: moduleMatcher(graph.nodes)
            }
        );
        search.bind('typeahead:selected', function(ev, module) { focusOnNode(module) });
    }

    function updateGraph() {
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
          .start(10,10,10);

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

        var node = viewport.selectAll(".node")
            .data(graph.nodes);

        var nodeG = node.enter().append("g")
            .attr("class", "node")
            .call(force.drag);

        nodeG.append("circle")
            .on("click", function(d) {
                d3.event.stopPropagation();
                $scope.graphSelected = d;
                $scope.$apply();
                focusOnNode(d);
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

        nodeG.append("text")
            .attr("y", nodeRadius+8)
            .attr("text-anchor", "middle");

        node.selectAll(".hiddenEdgeMarkers").remove();

        var hiddenEdgeGroups = node.append("g").attr("class", "hiddenEdgeMarkers");
        hiddenEdgeGroups[0].forEach(function(hiddenEdgeGroup) {
            var inbound = edgesByTarget[hiddenEdgeGroup.__data__.index];

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
            .style("fill", '#666')
            .style("stroke", d3.rgb('#666').darker(2))
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

        force.on("end", function() {
            focusOnNode(root);
            zoomAndCenter(root);
        });
    }

    /**
     * Determines the bounding rectangle that encloses the focus.
     * Included in the bounding box are all upstream dependencies, all first order ancestors,
     * and the root node.
     */
    function boundingBox(focus) {
        var x1 = Infinity, x2 = -Infinity, y1 = Infinity, y2 = -Infinity;

        graph.nodes.forEach(function(node) {
            var isParent = false;
            if(edgesByTarget[focus.index]) {
                for (var i = 0; i < edgesByTarget[focus.index].length; i++) {
                    if (edgesByTarget[focus.index][i].source == node.index) {
                        isParent = true;
                        break;
                    }
                }
            }

            if(isParent || node == root || distMatrix.dist(focus, node) < Infinity) {
                if(node.bounds.x > x2) x2 = node.bounds.x;
                if(node.bounds.x < x1) x1 = node.bounds.x;
                if(node.bounds.y > y2) y2 = node.bounds.y;
                if(node.bounds.y < y1) y1 = node.bounds.y;
            }
        });

        // the bounding box is calculated on the centers of the nodes at the extremeties, expand it to include some padding around these nodes
        var pad = 16;
        return { x: x1-pad, y: y1-pad, w: x2-x1+(pad*2), h: y2-y1+(pad*2) };
    }

    function focusOnNode(focus) {
        var nodeColor = function (d) {
            var dist = distMatrix.dist(focus, d);
            return d3.rgb(dist == Infinity ? '#666' : colorByDistance(Math.min(dist, 4)));
        };

        viewport.selectAll(".node").selectAll("circle")
            .transition()
            .style("fill", nodeColor)
            .style("stroke", function (d) { return nodeColor(d).darker(2) });

        focusOnPath(focus, root);
        displayFirstOrderDependantLinks(focus);
        updateNodeLabels(focus);

        tip.hide();
    }

    function displayFirstOrderDependantLinks(focus) {
        var inbound = edgesByTarget[focus.index];

        var firstOrderLink = viewport.selectAll(".firstOrderLink")
            .data(inbound ? inbound : []);

        firstOrderLink
            .enter().append("svg:path")
            .attr("class", "firstOrderLink");

        repositionFirstOrderLinks();

        firstOrderLink.exit().remove();
    }

    /**
     * Resize the viewport to include the bounding box around focus and its related nodes, and zoom so that this
     * bounding box just fits in the viewport
     */
    function zoomAndCenter(focus) {
        var bounds = boundingBox(focus);

        var aspectRatio = width/height;
        var boundingAspectRatio = bounds.w/bounds.h;

        var scale = boundingAspectRatio > aspectRatio ? width/bounds.w : height/bounds.h;
        var targetWidth = boundingAspectRatio > aspectRatio ? bounds.w : width/scale;
        var translate = [-bounds.x*scale, -bounds.y*scale];

        var i = d3.interpolateZoom([zoom.translate()[0], zoom.translate()[1], width*zoom.scale()],
            [translate[0], translate[1], targetWidth]);

        viewport.transition().delay(100)
            .duration(i.duration/2)
            .attrTween("transform", function() {
                return function(t) {
                    var p = i(t);
                    return "translate(" + p[0] + "," + p[1] + ")scale(" + (width / p[2]) + ")";
                }
            })
            .each("end", function() {
                zoom.translate(translate);
                zoom.scale(scale);
            });
    }

    /**
     * Display node label text for all dependencies of focus, all nodes along the shortest path, and all first
     * order dependants
     */
    function updateNodeLabels(focus) {
        var shortestPathSources = distMatrix.path(root, focus).map(function(d) { return d.source });
        viewport.selectAll(".node text")
            .text(function(d) {
                return shortestPathSources.indexOf(d) > -1 || distMatrix.dist(focus, d) < Infinity ? d.name : "";
            });
    }

    function zoomed(translate, scale) {
        viewport.attr("transform", "translate(" + translate + ")scale(" + scale + ")");
        tip.hide();
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

    function focusOnPath(focus, root) {
        var shortestPath = distMatrix.path(root, focus);

        var inPath = function(d) {
            var intersection = shortestPath.filter(function(seg) {
                return seg.source.name == d.source.name && seg.target.name == d.target.name
            });
            return intersection.length > 0
        };

        viewport.selectAll(".link")
            .style("stroke", function(d) { return inPath(d) ? 'magenta' : '#999' })
            .style("stroke-dasharray", function(d) { return inPath(d) ? "5,5" : "0,0" })
            .style("stroke-opacity", function(d) { return inPath(d) ? 1 : 0.6 });
    }
});
