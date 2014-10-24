app.controller('GremlinCtrl', function($scope, $cookies, Restangular/*, hotkeys*/) {
    $scope.queryPending = false;

    $scope.limitEnabled = true;
    $scope.limit = 100;
    $scope.start = 0;

    $scope.command = ''; // most queries will start with this

    $scope.setOrdering = function(type, key) {
        if($scope.orderingByType[type] == key)
            $scope.reverseByType[type] = !$scope.reverseByType[type];
        else {
            $scope.orderingByType[type] = key;
            $scope.reverseByType[type] = false;
        }
    };

    var typeProperties = {};

    $scope.history = new QueryHistory($scope, $cookies);

    $scope.query = function() {
        $scope.start = 0;
        executeQuery();
        $scope.command = $scope.history.saveHistory()
    };

    $scope.nextPage = function() {
        $scope.start = $scope.start + $scope.graphElements.length;
        executeQuery()
    };

    $scope.previousPage = function() {
        $scope.start = $scope.start - $scope.limit;
        executeQuery()
    };

    var clear = function() {
        $scope.orderingByType = {};
        $scope.reverseByType = {};
        $scope.visiblePropsByType = {};
        $scope.errors = null;
        $scope.graphElements = null
    };

    var executeQuery = function() {
        clear();
        $scope.queryPending = true;
        var params = { start: $scope.start };
        if($scope.limitEnabled) params.limit = $scope.limit;

        var query = '_()' + ($scope.command ? '.' + $scope.command : '');

        Restangular.all('gremlin').customPOST(query, '', params, {'Content-Type': 'text/plain'}).then(
            function(response) {
                // assign indexes to each node
                response.nodes.forEach(function(node, index) { node.indexLabel = $scope.start + index + 1 });

                $scope.graphElements = response.nodes;
                $scope.hasNextPage = response.hasNextPage;
                $scope.errors = null;

                var types = d3.set([]);

                typeProperties = {};
                $scope.graphElements.forEach(function(elem) {
                    types.add(elem['label']);

                    var props = typeProperties[elem['label']];
                    if(props == null) {
                        props = [];
                        typeProperties[elem['label']] = props;
                    }
                    for(var prop in elem)
                        if(props.indexOf(prop) == -1 && prop != 'streamRevision' && prop != 'label' && prop != 'indexLabel')
                            props.push(prop);

                    $scope.visiblePropsByType[elem['label']] = props
                });

                $scope.typeLegend = types.values().map(function(type) {
                    return { type: type, color: color(type).toString() };
                });

                updateGraph({ nodes: [], links: [] });
                updateGraph(response);
                $scope.queryPending = false;
            },
            function(error) {
                $scope.graphElements = null;
                $scope.errors = error.data.msg;
                $scope.queryPending = false;
                $scope.hasNextPage = false;

                if(error.status == 0) {
                    $scope.errors = ["Unable to connect to query service.  Is the server down?"];
                }
            }
        )
    };

    $scope.typeProperties = function(type) { return typeProperties[type] };

    $scope.exportToCsv = function(type) { exportDelimited(type, ",") };
    $scope.exportToTsv = function(type) { exportDelimited(type, "\t") };

    var exportDelimited = function(type, delim) {
        var csv = "data:text/csv;charset=utf-8,";
        typeProperties[type].forEach(function(prop) {
            if(prop != "label")
               csv += prop + delim
        });
        csv = csv.substring(0, csv.length-1) + "\n";

        $scope.graphElements.forEach(function(elem, index) {
            if(elem['label'] == type) {
                var dataString = "";
                typeProperties[type].forEach(function(prop) {
                    if(prop != "label") {
                        var val = elem[prop] != null ? elem[prop] : "";
                        dataString += val + delim
                    }
                });

                csv += dataString.substring(0,dataString.length-1) + "\n"; // strip off last ,
            }
        });
        window.open(encodeURI(csv.substring(0,csv.length-1))); // strip off last \n
    };

    clear();

    // ------------- Graph view -----------------------------
    var width = 1024, height = 800;

    var color = d3.scale.category20();

    var force = cola.d3adaptor()
        .linkDistance(75)
        .size([width, height])
        .avoidOverlaps(true)
        .flowLayout('y',50);

    var svg = d3.select("#graph").append("svg")
        .attr("width", width)
        .attr("height", height)
        .style("pointer-events", "all")
        .on("click", function(d) {
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

    if(d3.tip != null) { // protected jasmine tests since d3-tip does not load correctly in jasmine
        var tip = d3.tip().attr('class', 'd3-tip').html(function(d) {
            var tipText = '<strong>' + d.label + '</strong> <em>(' + d.id + ')</em><br/>';
            $scope.visiblePropsByType[d['label']].forEach(function(property) {
                if (property != ['id'] && d[property] != null)
                    tipText += property + ": " + d[property] + "<br/>";
            });

            return tipText
        });

        tip.offset([-20,0]);
        svg.call(tip);
    }

    var updateGraph = function(graph) {
        var linkSpan = minimumSpanningTrees(graph.nodes, graph.links,
            function(d) { return d.index });

        var edgesByTarget = graph.links.reduce(
            function(acc, edge) {
                if(acc[edge.target])
                    acc[edge.target] += 1;
                else
                    acc[edge.target] = 1;
                return acc;
            }, {});

        force
          .nodes(graph.nodes)
          .links(linkSpan)
          .start(10,30,100);

        var link = viewport.selectAll(".link")
          .data(linkSpan);

        link.enter().append("svg:path")
            .attr("class", "link")
            .attr("id", function(d) { return d.source.index + "_" + d.target.index });
        link.exit().remove();

        var edgeLabelText = viewport.selectAll(".edgeLabel")
            .data(linkSpan);

        edgeLabelText.exit().remove();

        edgeLabelText.enter().append("svg:text")
            .attr("class", "edgeLabel")
          .append("svg:textPath")
            .attr("class", "edgeLabelText")
            .attr("text-anchor", "middle")
            .attr("xlink:href", function(d) { return "#" + d.source.index + "_" + d.target.index })
            .attr("startOffset", "70%");

        viewport.selectAll('.edgeLabelText')
            .text(function(d) { return d.label });

        var node = viewport.selectAll(".node")
            .data(graph.nodes);

        var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .call(force.drag);

        var nodeRadius = 9;

        nodeEnter.append("circle")
            .attr("r", nodeRadius)
            .on("click", function(d) {
                d3.event.stopPropagation();
                $scope.graphSelected = d;
                $scope.$apply();
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
            var hiddenEdgeCount = edgesByTarget[hiddenEdgeGroup.__data__.index]-1;
            var anglePerEdge = hiddenEdgeCount == 1 ? 1 : Math.PI/(hiddenEdgeCount-1);

            for(var i = 0; i < hiddenEdgeCount; i++) {
                d3.select(hiddenEdgeGroup).append("circle")
                    .attr("cx", Math.cos(anglePerEdge*i-Math.PI/2) * (nodeRadius+3))
                    .attr("cy", Math.sin(anglePerEdge*i-Math.PI/2) * (nodeRadius+3))
                    .attr("r", 2);
            }
        });

        node.selectAll("circle")
            .style("fill", function(d) { return color(d['label']) })
            .style("stroke", function(d) { return d3.rgb(color(d['label'])).darker(2) });

        node.selectAll(".hiddenEdgeMarkers").selectAll("circle")
            .style("fill", "black");

        node.exit().remove();

        force.on("tick", function() {
            link.attr("d", function (d) {
                cola.vpsc.makeEdgeBetween(d, d.source.bounds, d.target.bounds,
                    14);
                var lineData = [{ x: d.sourceIntersection.x, y: d.sourceIntersection.y }, { x: d.arrowStart.x, y: d.arrowStart.y }];
                return lineFunction(lineData);
            });
            if (isIE())
                link.each(function() { this.parentNode.insertBefore(this, this) });

            node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")" });
        });
    };

    function zoomed() {
        viewport.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
        tip.hide();
    }

//    hotkeys.add({
//        combo: 'ctrl+c',
//        description: 'Copy the unique id of a selected graph vertex',
//        callback: function() {
//            console.log("copying!")
//        }
//    })
});