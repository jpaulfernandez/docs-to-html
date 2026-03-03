// D3 v7 + GSAP ScrollTrigger chart initialization scripts
// These are injected as a <script> block at the bottom of the generated HTML body

export const CHART_INIT_SCRIPT = `
(function() {
  function waitFor(fn) {
    if (typeof d3 !== 'undefined' && typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      fn();
    } else {
      setTimeout(function() { waitFor(fn); }, 50);
    }
  }

  waitFor(function() {
    gsap.registerPlugin(ScrollTrigger);
    var charts = window.__charts || [];

    charts.forEach(function(cfg) {
      var el = document.getElementById(cfg.id);
      var dataEl = document.getElementById(cfg.id + '-data');
      if (!el || !dataEl) return;

      var rawData;
      try { rawData = JSON.parse(dataEl.textContent); } catch(e) { return; }
      if (!rawData || !rawData.length) return;

      var container = el.parentElement;
      var W = container.clientWidth || 600;
      var H = 320;
      var margin = {top: 20, right: 20, bottom: 50, left: 50};
      var w = W - margin.left - margin.right;
      var h = H - margin.top - margin.bottom;

      var svg = d3.select(el)
        .attr('width', W)
        .attr('height', H)
        .attr('viewBox', '0 0 ' + W + ' ' + H)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      var xKey = cfg.xKey;
      var yKey = cfg.yKey;
      var color = cfg.color || 'var(--accent)';

      if (cfg.type === 'bar') {
        var xScale = d3.scaleBand()
          .domain(rawData.map(function(d) { return d[xKey]; }))
          .range([0, w])
          .padding(0.2);

        var yMax = d3.max(rawData, function(d) { return +d[yKey]; }) || 1;
        var yScale = d3.scaleLinear().domain([0, yMax * 1.1]).range([h, 0]);

        svg.append('g').attr('transform', 'translate(0,' + h + ')').call(d3.axisBottom(xScale).tickSizeOuter(0));
        svg.append('g').call(d3.axisLeft(yScale).ticks(5).tickFormat(d3.format('.2s')));

        var bars = svg.selectAll('.bar')
          .data(rawData)
          .enter()
          .append('rect')
          .attr('class', 'bar')
          .attr('x', function(d) { return xScale(d[xKey]); })
          .attr('width', xScale.bandwidth())
          .attr('y', h)
          .attr('height', 0)
          .attr('fill', color)
          .attr('rx', 3);

        ScrollTrigger.create({
          trigger: el,
          start: 'top 85%',
          once: true,
          onEnter: function() {
            bars.transition().duration(800).delay(function(d, i) { return i * 60; })
              .attr('y', function(d) { return yScale(+d[yKey]); })
              .attr('height', function(d) { return h - yScale(+d[yKey]); });
          }
        });

      } else if (cfg.type === 'line') {
        var xScaleL = d3.scaleBand()
          .domain(rawData.map(function(d) { return d[xKey]; }))
          .range([0, w])
          .padding(0.1);
        var xMid = function(d) { return xScaleL(d[xKey]) + xScaleL.bandwidth() / 2; };

        var yMaxL = d3.max(rawData, function(d) { return +d[yKey]; }) || 1;
        var yScaleL = d3.scaleLinear().domain([0, yMaxL * 1.1]).range([h, 0]);

        svg.append('g').attr('transform', 'translate(0,' + h + ')').call(d3.axisBottom(xScaleL).tickSizeOuter(0));
        svg.append('g').call(d3.axisLeft(yScaleL).ticks(5).tickFormat(d3.format('.2s')));

        var line = d3.line().x(xMid).y(function(d) { return yScaleL(+d[yKey]); }).curve(d3.curveCatmullRom);
        var path = svg.append('path')
          .datum(rawData)
          .attr('fill', 'none')
          .attr('stroke', color)
          .attr('stroke-width', 2.5)
          .attr('d', line);

        var len = path.node().getTotalLength();
        path.attr('stroke-dasharray', len).attr('stroke-dashoffset', len);

        ScrollTrigger.create({
          trigger: el,
          start: 'top 85%',
          once: true,
          onEnter: function() {
            path.transition().duration(1200).ease(d3.easeLinear).attr('stroke-dashoffset', 0);
          }
        });

      } else if (cfg.type === 'donut') {
        var size = Math.min(W, H);
        var radius = size / 2 - 10;
        var donutSvg = d3.select(el)
          .attr('width', size).attr('height', size)
          .attr('viewBox', '0 0 ' + size + ' ' + size)
          .append('g')
          .attr('transform', 'translate(' + size/2 + ',' + size/2 + ')');

        var pie = d3.pie().value(function(d) { return +d[yKey]; });
        var arc = d3.arc().innerRadius(radius * 0.55).outerRadius(radius);
        var colors = [color, '#ff8c5a', '#cbccdc', '#454d60', '#6c6f8b'];

        var arcs = donutSvg.selectAll('.arc')
          .data(pie(rawData))
          .enter().append('g').attr('class', 'arc');

        arcs.append('path')
          .attr('d', arc)
          .attr('fill', function(d, i) { return colors[i % colors.length]; })
          .attr('opacity', 0);

        ScrollTrigger.create({
          trigger: el,
          start: 'top 85%',
          once: true,
          onEnter: function() {
            donutSvg.selectAll('.arc path')
              .transition().duration(800).delay(function(d, i) { return i * 120; })
              .attr('opacity', 1)
              .attrTween('d', function(d) {
                var i = d3.interpolate(d.startAngle, d.endAngle);
                return function(t) { d.endAngle = i(t); return arc(d); };
              });
          }
        });
      }
    });

    // Fade-up animations for data-anim elements
    document.querySelectorAll('[data-anim="fade-up"]').forEach(function(el) {
      gsap.fromTo(el, {opacity: 0, y: 40}, {
        opacity: 1, y: 0, duration: 0.7, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    });

    // Slide-left for pull quotes
    document.querySelectorAll('[data-anim="slide-left"]').forEach(function(el) {
      gsap.fromTo(el, {opacity: 0, x: -60}, {
        opacity: 1, x: 0, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true }
      });
    });

    // Divider line draw
    document.querySelectorAll('.ms-divider__line').forEach(function(line) {
      ScrollTrigger.create({
        trigger: line,
        start: 'top 90%',
        once: true,
        onEnter: function() {
          var len = line.getTotalLength();
          line.style.strokeDasharray = len;
          line.style.strokeDashoffset = len;
          gsap.to(line, {strokeDashoffset: 0, duration: 1, ease: 'power2.inOut'});
        }
      });
    });

    // Hero parallax
    document.querySelectorAll('.ms-hero').forEach(function(hero) {
      gsap.to(hero, {
        backgroundPositionY: '30%',
        ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
      });
      gsap.fromTo(hero.querySelector('.ms-hero__title'), {opacity: 0, y: 50}, {
        opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: 0.2
      });
    });
  });
})();
`;
