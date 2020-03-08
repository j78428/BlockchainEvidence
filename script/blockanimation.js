$(function() {
    var OD_PAIRS = [
        ["NRT", "JFK"],
        ["SFO", "NRT"],
        ["LAX", "HNL"],
        ["HNL", "NRT"],
        ["CDG", "JFK"],
        ["NRT", "SYD"],
        ["FCO", "PEK"],
        ["LHR", "PVG"],
        ["NRT", "ARN"],
        ["LAX", "JFK"],
        ["NRT", "DEL"],
        ["DFW", "GRU"],
        ["MAD", "ATL"],
        ["ORD", "CAI"],
        ["HKG", "CDG"],
        ["LAS", "CDG"],
        ["NRT", "SVO"],
        ["DEN", "HNL"],
        ["ORD", "LAX"],
        ["SIN", "SEA"],
        ["SYD", "PEK"],
        ["CAI", "CPT"],
        ["CUN", "JFK"],
        ["ORD", "JFK"],
        ["LHR", "BOM"],
        ["LAX", "MEX"],
        ["LHR", "CPT"],
        ["PVG", "CGK"],
        ["SYD", "BOM"],
        ["JFK", "CPT"],
        ["MAD", "GRU"],
        ["EZE", "FCO"],
        ["DEL", "DXB"],
        ["DXB", "NRT"],
        ["GRU", "MIA"],
        ["SVO", "PEK"],
        ["YYZ", "ARN"],
        ["LHR", "YYC"],
        ["HNL", "SEA"],
        ["JFK", "EZE"],
        ["EZE", "LAX"],
        ["CAI", "HKG"],
        ["SVO", "SIN"],
        ["IST", "MCO"],
        ["MCO", "LAX"],
        ["FRA", "LAS"],
        ["ORD", "FRA"],
        ["MAD", "JFK"]
    ];

    var strokeColor = ['DarkViolet', 'DeepPink', 'DeepSkyBlue', 'Gold', 'GreenYellow', 'Magenta', 'OrangeRed'];

    var currentWidth = $('#map').width();
    var width = 938;
    var height = 400;

    var projection = d3.geo
        .mercator()
        .scale(150)
        .translate([width / 2, height / 1.41]);

    var path = d3.geo
        .path()
        .pointRadius(2)
        .projection(projection);

    var svg = d3.select("#map")
        .append("svg")
        .attr("preserveAspectRatio", "xMidYMid")
        .attr("viewBox", "0 0 " + width + " " + height)
        .attr("width", currentWidth)
        .attr("height", '400px');

    var airportMap = {};
    var lastSrc = '';
    var lastDst = '';

    function transition(plane, route) {
        var l = route.node().getTotalLength();
        plane.transition()
            .duration(l * 50)
            .attrTween("transform", delta(plane, route.node()))
            .each("end", function() { route.remove(); })
            .remove();
    }

    function delta(plane, path) {
        var l = path.getTotalLength();
        var plane = plane;
        return function(i) {
            return function(t) {
                var p = path.getPointAtLength(t * l);

                var t2 = Math.min(t + 0.05, 1);
                var p2 = path.getPointAtLength(t2 * l);

                var x = p2.x - p.x;
                var y = p2.y - p.y;
                var r = 90 - Math.atan2(-y, x) * 180 / Math.PI;

                var s = Math.min(Math.sin(Math.PI * t) * 0.7, 0.3);

                return "translate(" + p.x + "," + p.y + ") scale(" + s + ") rotate(" + r + ")";
            }
        }
    }

    function coord(x, y) {
        var c = [x, y];
        return {
            x: {
                valueOf: function() {
                    var p = projection(c);
                    return p[0];
                }
            },
            y: {
                valueOf: function() {
                    var p = projection(c);
                    return p[1];
                }
            }
        }
    }

    function fly(origin, destination, index) {
        var route = svg.append("path")
            .datum({ type: "LineString", coordinates: [airportMap[origin], airportMap[destination]] })
            .attr("class", "route")
            .attr("id", "p" + index)
            .attr("stroke", strokeColor[index % 7])
            .attr("d", path);

        if (lastSrc.length > 0 && lastDst.length > 0) {
            $("#" + lastSrc).removeAttr('fill');
            $("#" + lastSrc).removeAttr('stroke');
            $("#" + lastSrc).removeAttr('stroke-width');
        }
        lastSrc = origin;
        lastDst = destination;
        $("#" + origin).attr('fill', 'red');
        $("#" + origin).attr('stroke', 'red');
        $("#" + origin).attr('stroke-width', '5px');
    }

    function loaded(error, countries, airports) {
        svg.append("g")
            .attr("class", "countries")
            .selectAll("path")
            .data(topojson.feature(countries, countries.objects.countries).features)
            .enter()
            .append("path")
            .attr("d", path);

        svg.append("g")
            .attr("class", "airports")
            .selectAll("path")
            .data(topojson.feature(airports, airports.objects.airports).features)
            .enter()
            .append("path")
            .attr("id", function(d) { return d.id; })
            .attr("d", path);

        var geos = topojson.feature(airports, airports.objects.airports).features;
        for (i in geos) {
            airportMap[geos[i].id] = geos[i].geometry.coordinates;
        }

        var i = 0;
        setInterval(function() {
            if (i > OD_PAIRS.length - 1) {
                i = 0;
            }
            if (i > 0) {
                var t = i - 1;
            } else {
                var t = OD_PAIRS.length - 1;
            }
            $("#p" + t).remove();
            var od = OD_PAIRS[i];
            fly(od[0], od[1], i);
            i++;
        }, 150);
    }

    queue().defer(d3.json, "data/countries2.topo.json")
        .defer(d3.json, "data/airports2.topo.json")
        .await(loaded);

    $(window).resize(function() {
        currentWidth = $("#map").width();
        svg.attr("width", currentWidth);
        svg.attr("height", '400px');
    });
});