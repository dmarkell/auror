(function() {
  looker.plugins.visualizations.add({
    id: 'lookfilter',
    label: 'Crossfilter',
    options: {
      colorRange: {
        type: 'array',
        label: 'Color Ranges',
        section: 'Style',
        placeholder: '#fff, red, etc...'
      }
    },
    handleErrors: function(data, resp) {
      return true;
    },
    create: function(element, settings) {
      
      var origin = window.location.origin;
      
      console.log(">> Create");
      // console.log("TRACER3")

      // add the stylesheets
      $('head')
        .append($("<link></>").attr({
          "rel": "stylesheet", "type": "text/css",
          "href": "https://cdnjs.cloudflare.com/ajax/libs/dc/1.7.5/dc.min.css"
        }))
        .append($("<link></>").attr({
          "rel": "stylesheet", "type": "text/css",
          "href": origin + "/plugins/visualizations/lookfilter_style.css"
        }))

      $(element)
        // don't neeed a header for now... OR DO WE!
        .append(
          $("<header></header>")
            .append(
              $("<div></div>")
                .attr("id", "title-block")
                .css({
                  "margin-left": "20px",
                  "margin-top": "10px"

                })
            )
            .append(
              $("<h1></h1>").css("float", "left")
                .append($("<span></span>").addClass("logo-color").text("look"))
                .append($("<span></span>").text("filter"))
            )
        )
        .append($("<div></div>").addClass("container")
          .append($("<div></div>").addClass("loading"))
          .append($("<div></div>").attr("id", "global-rows"))
          // .append($("<div></div>").attr("id", "timeseries-chart-rows"))
          // .append($("<div></div>").attr("id", "chart-rows"))
          // .append($("<div></div>").attr("id", "player-table"))
        )

        // container for data-count
        $("#title-block")
          .append(
            $("<div></div>")
              .attr("id", "chart-rows-control")
              .css("display", "none")
              .append(
                $("<div></div>")
                  .css("float", "none")
                  .addClass("data-count")
                  .append($("<span></span>").addClass("filter-count"))
                  .append(" records selected out of ")
                  .append($("<span></span>").addClass("total-count"))
              )
        )

    },
    update: function(data, element, settings, resp) {
      
      console.log(">> Update");

      window.results = {
        data: data,
        element: element,
        settings: settings,
        resp: resp
      }

      if (!this.handleErrors(data, resp)) return;

      var this_query = resp.cache_key;

      var last_query = $("#last_query").text();
      $("#title-block")
          .append(
            $("<div></div>")
              .attr("id", "chart-rows-control")
              .css("display", "none")
              .append(
                $("<div></div>")
                  .css("float", "none")
                  .addClass("data-count")
                  .append($("<span></span>").addClass("filter-count"))
                  .append(" records selected out of ")
                  .append($("<span></span>").addClass("total-count"))
              )
        )
      // var last_query = window.last_query;

      // this update function runs every time anything happens (probably for
      // resizing the screen) but that will be real slow, so we will cache the
      // query and only continue if the data is new
      // TODO: do less invasive updates / redraws on screen resizing
      if (last_query && this_query == last_query) {
        return
      }

      // TODO: put this on window object so it doesn't reload on toggle vis pane
      // (still would need to redraw though become the element got wiped)
      // window.last_query = this_query;
      
      $(element)
        .append($("<div></div>")
          .css("display", "none")
          .attr("id", "last_query")
          .text(this_query)
        )

      var crossfilter_src = 'https://cdnjs.cloudflare.com/ajax/libs/crossfilter/1.3.12/crossfilter.min.js';
      var dc_src = 'https://cdnjs.cloudflare.com/ajax/libs/dc/1.7.5/dc.min.js';
      $.getScript(crossfilter_src, function() {
        $.getScript(dc_src, function () {

          // Various formatters.
          var formatNumberGeneral = d3.format("d"),
              formatNumber = d3.format(",d"),
              formatPrec0 = d3.format(".0f"),
              formatPrec1 = d3.format(".1f"),
              formatPrec2 = d3.format(".2f"),
              formatPrec3 = d3.format(".3f"),
              formatChange = d3.format("+,d"),
              formatPercent2 = d3.format(".2%"),
              formatPercent1 = d3.format(".1%"),
              formatPercent0 = d3.format("%"),
              formatDate = d3.time.format("%B %d, %Y"),
              formatDateShort = d3.time.format("%b. %d, %Y"),
              formatTime = d3.time.format("%I:%M %p");


          var toggle_loading = function() {
            $(".loading").toggle();
            $("#title").toggleText("(Running)", "SABRfilter")

          }

          var avgNullsAccessor = function(d) { 
            // gaurd against dividing by zero
            return (d.count_non_null === 0) ? 0: d.sums / d.count_non_null;
          };

          var is_not_nan = function(d) { return !(isNaN(d))};

          function reduceAddAvgNulls(attr) {
            return function(p,v) {
              ++p.count;
              if (is_not_nan(v[attr])) {
                p.sums += v[attr];
                ++p.count_non_null;
              }

              return p;
            };
          };

          function reduceRemoveAvgNulls(attr) {
            return function(p,v) {
              --p.count;
              if (is_not_nan(v[attr])) {
                p.sums -= v[attr];
                --p.count_non_null;
              };

              return p;
            };
          };

          function reduceInitAvgNulls() {
            return {
              count:0, count_non_null: 0, sums:0, 
            };
          };

          function chartElement(dim_name, chart_name, control_elem) {

            return makeChartElement(dim_name, chart_name, false, control_elem);
          };

          function annotatedChartElement(dim_name, chart_name, control_elem) {

            return makeChartElement(dim_name, chart_name, true, control_elem);
          };

          function makeChartElement(dim_name, chart_name, metric_annotations, control_elem) {

            var chart_name = typeof chart_name !== 'undefined' ? chart_name : dim_name;

            var chart_name_id = dim_name.replace(/ /g, "");

            var chart_wrapper = $('<div></div>').addClass("dc-wrapper");
            var chart_element = $('<div></div>').attr("id", chart_name_id);

            if (metric_annotations) {
              chart_element
                .append($("<div></div>").css({"position": "absolute", "display": "inline", "margin": "0 0 0 40px"})
                  .append($('<span></span>').addClass('reset').css("display", "none")
                    .text("range: ")
                    .append($("<span></span>").addClass("filter"))
                  )
                  .append($('<a></a>').addClass("reset")
                    .attr("href", "javascript:" + chart_name_id + "Chart.filterAll();dc.redrawAll();")
                    .css("display", "none")
                    .text("reset")
                  )
                )
                .append($('<span></span>').text(chart_name))
                .append($('<div class="nd-container"></div>')
                  .css({
                        "float": "right"
                  })
                )
            } else {

              chart_element.append($('<span></span>').text(chart_name));
              chart_element
                .append($("<div></div>").css({"display": "inline-block"})
                  .append($('<span></span>').addClass('reset').css("display", "none")
                    .text("range: ")
                    .append($("<span></span>").addClass("filter"))
                  )
                  .append($('<a></a>').addClass("reset")
                    .attr("href", "javascript:" + chart_name_id + "Chart.filterAll();dc.redrawAll();")
                    .css("display", "none")
                    .text("reset")
                  )
                )
            }

            chart_element
              .append($('<div></div>').addClass("clearfix"));


            chart_wrapper.append(chart_element)
            if (control_elem) {
               chart_wrapper.append(control_elem);
            }

            return chart_wrapper;
          };

          // console.log('dim1', resp.fields.dimensions[0].name);
          // console.log('piv1', resp.fields.pivots[0].name);
          // console.log('mes1', resp.fields.measures[0].name);

          var meta_lookup = {};
          var meta_keys = ['label_short', 'type'];
          var primary_key_labels = ["id", "distinct id", "user id", "subject id", "random", "hashed id"];

          $.each(
            _.union(
              resp.fields.dimensions,
              resp.fields.measures,
              resp.fields.table_calculations
            ),
            function(i, item) {
              var name = item['name'].replace(".", "_");
              var entry = {};
              meta_keys.forEach(function(k) {
                if (primary_key_labels.indexOf(item.label_short.toLowerCase()) == -1) {
                  if (typeof meta_lookup[name] === 'undefined') {
                    meta_lookup[name] = {};
                  }
                  meta_lookup[name][k] = item[k];
                }
              })
            }
          )

          window.meta_lookup = meta_lookup;
          var field_names = [];

          var rows = [];

          results.data.forEach(function(el) {
            var row = {};
            $.each(el, function(k, item) {
              var k_clean = k.replace('.', '_');
              row[k_clean] = item.value
            })
            rows.push(row);
          })

          

          var crossfilter_src = 'https://cdnjs.cloudflare.com/ajax/libs/crossfilter/1.3.12/crossfilter.min.js';
          var dc_src = 'https://cdnjs.cloudflare.com/ajax/libs/dc/1.7.5/dc.min.js';
          // $.getScript(crossfilter_src, function() {
          //   $.getScript(dc_src, function () {

          var ndx = crossfilter(rows);
          window.ndx = ndx;
          var all = ndx.groupAll();

          var dims = {};
          var groups = {};

          $.each(meta_lookup, function(k, v) {
            dims[k] = ndx.dimension(function(d) { return d[k]; });
            // TODO: add grouping logic based on range and default number of bins
            groups[k + 's'] = dims[k].group();
          }) 

          window.groups = groups;

          function make_row_chart(dim, options) {

            var default_orderer = function(d) { return -d.value };
            
            var num_rows = 5;
            var group = options && options['group'] || dim + 's';
            var xFormatter = options && options['xFormatter'] || formatNumberGeneral;
            var w = options && options['w'] || 350;
            var h = options && options['h'] || 50 * num_rows;
            var orderer = options && options['orderer'] || default_orderer;

            rowChart = dc.rowChart("#" + dim)
              .width(w).height(h)
              .dimension(dims[dim])
              .group(groups[group])
              .elasticX(true)
              .rowsCap(num_rows)
              .valueAccessor(function(d) { return d.value })
              .ordering(orderer)
            ;
            
            rowChart.xAxis().tickFormat(xFormatter);

            return rowChart;

          };

          function make_pie_chart(dim, options) {

            var group = options && options['group'] || dim + 's';

            var pie = dc.pieChart("#" + dim)
              .radius(75)
              .innerRadius(10)
              .height(150).width(250)
              .dimension(dims[dim])
              .group(groups[group])
              .label(function (d) {

                    if (pie.hasFilter() && ! pie.hasFilter(d.data.key)) {
                        return d.data.key + ' 0%';
                    }
                    var label = d.data.key;
                    if (all.value()) {
                        label += ' ' + Math.floor(d.value / all.value() * 100) + '%';
                    }
                    return label;
                })
              ;

            return pie;

          };

          function make_hist_chart(dim, options) {

            var defaultFilterPrinter = function(filters) {
              var filter = filters[0], s='';
              s += (filter[0] + ' -> ' + filter[1]);
              return s;
            }

            var defaultValueAccessor = function(d) { return d.value };

            var group = options && options['group'] || dim + 's';
            var xFormatter = options && options['xFormatter'] || function(n) { return formatNumber(parseInt(n))};
            var yAxisFormatter = options && options['yAxisFormatter'] || formatNumber;
            var filterPrinter = options && options['filterPrinter'] || defaultFilterPrinter;
            var valueAccessor = options && options['valueAccessor'] || defaultValueAccessor;
            var w = options && options['w'] || 350;
            var h = options && options['h'] || 150;
            var rounder = options && options['rounder'] || dc.round.ceil;
            var grouper = options && options['grouper'] || groups[group];
            var elasticY = options && options['elasticY'] || true;
            var elasticX = options && options['elasticX'] || false;
            var filter = options && options['filter'] || null;

            // console.log(groups, group, groups)
            var bins = groups[group].top(Infinity).map(function(item) {
              return item.key;
            }).sort(function(a,b) {
              return a - b;
            });
            var size = bins.length;
            
            // TODO: default these to 10th / 90th percentile for numeric data
            var domain_min = options && options['domain_min'] || bins[0];
            var domain_max = options && options['domain_max'] || bins[size-1];
            // size bins to min and max in case the min and max are not based on actual size.
            var num_bins = bins.filter(function(b) {
              return b >= domain_min && b <= domain_max;
            }).length;

            // console.log('>', dim, size, num_bins, bins[0], bins[size-1], domain_min, domain_max)
            var hist = dc.barChart("#" + dim)
              .width(w).height(h)
              .elasticY(elasticY)
              .elasticX(elasticX)
              .xAxisPadding(10)
              .round(rounder)
              .margins({top: 10, right: 10, bottom: 20, left: 40})
              .xUnits(function() { return num_bins })
              // .centerBar(true)
              .filter(filter)
              .x(d3.scale.linear()
                .domain([
                  domain_min,
                  domain_max
                ])
              )
              .dimension(dims[dim])
              .group(grouper)
              .valueAccessor(valueAccessor)
              .filterPrinter(filterPrinter)
            ;

            hist.yAxis().tickFormat(yAxisFormatter)
            hist.xAxis().tickFormat(xFormatter)

            var make_number_display = function(stat, numer, denom) {
              $('#' + dim).find(".nd-container")
                .append(
                  $('<div></div>')
                    .css({
                      "margin-right": "20px",
                      "display": "block"
                    })
                    .text(stat + ": ")
                    .append($("<span></span>")
                      .attr("id", "nd" + stat + "-" + dim)
                    )
                )

              var numer = options["numer"];
              var denom = options["denom"]

              var groupers = {
                "Avg": function() {
                      if (numer && denom) {

                        return function(g) {
                          return g.reduce(
                            reduceAddAvgRatio(numer, denom),
                            reduceRemoveAvgRatio(numer, denom),
                            reduceInitAvgRatio
                          )
                        }
                      } else {

                        
                        return function(g) {
                          var result = g.reduce(
                            reduceAddAvgNulls(dim),
                            reduceRemoveAvgNulls(dim),
                            reduceInitAvgNulls
                          )

                          return result
                        }
                      }
                    }(),
                "Sum": function(g) { return g.reduceSum(function(d) { return d[dim] }) }
              }

              var accessors = {
                "Avg": function() {

                      if (numer && denom) {
                        return average_ratio_accessor;
                      } else {
                        return avgNullsAccessor;
                      }
                    }(),
                "Sum": function(d) { return d }
              }


              var ndGrouper = groupers[stat];
              var ndAccessor = accessors[stat];

              var nd = dc.numberDisplay("#nd" + stat + "-" + dim)
                .formatNumber(xFormatter)
                .group(ndGrouper(ndx.groupAll()))
                .valueAccessor(ndAccessor)
            };

            var annotations = options['annotations'] || ["Avg"];

            annotations.forEach(function(item) {
              make_number_display(item);
            })

            return hist

          };

          var chart_global_row = $("<div></div>").addClass("chart-row");
          var ct = 0;
          var cols_per_row = 3;

          $.each(meta_lookup, function(k, v) {

            var chart_col = $("<div></div>").addClass("chart-col");

            chart_col.append(
              annotatedChartElement(k, v.label_short)
            )

            chart_global_row.append(chart_col);
            if (chart_global_row.children().length % cols_per_row == 0) {
              $("#global-rows").append(chart_global_row);
              chart_global_row = $("<div></div>").addClass("chart-row");
            } else if (ct == meta_lookup.length - 1) {
              $("#global-rows").append(chart_global_row);
            }

            ct += 1;

          });

          $("#global-rows").append(chart_global_row);

          var number_types = ['number', 'count', 'sum', 'count_distinct'];

          $.each(meta_lookup, function(k, v) {              
              
              // console.log(k, v);
              var chart_obj;
              if (number_types.indexOf(v.type) != -1) {
                chart_obj = make_hist_chart(k, {
                    'xFormatter': formatPrec0
                })
              };

              // todo: bar chart if cardinality > some number (6?)
              if (['string', 'yesno'].indexOf(v.type) != -1) {
                if (groups[k+'s'].size() <= 5) {
                  chart_obj = make_pie_chart(k);
                } else {
                  chart_obj = make_row_chart(k);

                }
              };

              window[k + 'Chart'] = chart_obj;
          });

          dc.dataCount('.data-count')
            .dimension(ndx)
            .group(all)
          ;

          $("#chart-rows-control").toggle();
          dc.renderAll();
        })
      })
    }
  });
}());
