// Timing doughnut chart
var timingChartCfg = {
  type: 'doughnut',
  data: {
    labels: ['Connection', 'DNS', 'Write', 'Wait', 'Read'],
    datasets: [
      {
        data: [],
        backgroundColor: ['#4a99e8', '#e84a71', '#ef9228', '#3cc150', '#a64cd3'],
        borderColor: 'rgb(28, 33, 37)',
        borderWidth: 3,
      },
    ],
  },

  options: {
    legend: {
      labels: { fontColor: '#bbb' },
      position: 'right',
    },
    responsive: false,
    aspectRatio: 0.5,
  },
}

// Response time histogram
var histChartCfg = {
  type: 'bar',
  data: {
    labels: [],
    datasets: [
      {
        label: '',
        backgroundColor: [],
        data: [],
        borderColor: 'rgba(0, 0, 0, 0.5)',
        borderWidth: 3,
        hoverBackgroundColor: '#166ff4',
      },
    ],
  },

  options: {
    responsive: true,
    maintainAspectRatio: false,
    legend: {
      display: false,
    },
    scales: {
      xAxes: [
        {
          ticks: { fontColor: '#bbb' },
          scaleLabel: {
            display: true,
            labelString: 'response time (seconds)',
          },
        },
      ],
      yAxes: [
        {
          ticks: { fontColor: '#bbb' },
          gridLines: { color: '#444' },
          scaleLabel: {
            display: true,
            labelString: 'count',
          },
        },
      ],
    },
    layout: { padding: { top: 20 } },
  },
}

// Response time scatter chart
var respChartCfg = {
  type: 'scatter',
  data: {
    datasets: [
      {
        label: '',
        data: [],
        pointBorderWidth: 0,
        pointHoverRadius: 10,
        pointBackgroundColor: 'red',
      },
    ],
  },

  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      xAxes: [
        {
          gridLines: { color: '#777' },
          ticks: { fontColor: '#bbb' },
          scaleLabel: {
            display: true,
            labelString: 'time into test (seconds)',
          },
        },
      ],
      yAxes: [
        {
          gridLines: { color: '#444' },
          ticks: { fontColor: '#bbb' },
          scaleLabel: {
            display: true,
            labelString: 'response time (seconds)',
          },
        },
      ],
    },
    onResize: function (chart) {
      let ctx = document.getElementById('resp-chart').getContext('2d')
      updateGradient(chart, ctx)
    },
  },
}

var BIN_COUNT = 10
var respChart = new Chart(document.getElementById('resp-chart').getContext('2d'), respChartCfg)
var timingChart = new Chart(document.getElementById('timing-chart').getContext('2d'), timingChartCfg)
var histChart = new Chart(document.getElementById('resp-hist').getContext('2d'), histChartCfg)

//
// Main data reporting / refresh function
//
function refresh() {
  document.querySelector('#thinResult').value = document.querySelector('#thinInput').value
  var dataThin = document.querySelector('#thinInput').value

  let csvName = document.querySelector('#csvSelect').value
  if (!csvName) return

  document.querySelector('#report').style.visibility = 'visible'

  // Reset data
  respChartCfg.data.datasets[0].data = []
  timingChartCfg.data.datasets[0].data = []
  histChartCfg.data.datasets[0].data = []
  histChartCfg.data.datasets[0].backgroundColor = []
  histChartCfg.data.labels = []

  var maxValue = 0
  var maxOffset = 0
  var minValue = Number.MAX_SAFE_INTEGER
  var respTotal = 0
  var rawDataCount = 0

  var connAvg = 0
  var connAvgCount = 0
  var dnsAvg = 0
  var dnsAvgCount = 0
  var writeAvg = 0
  var writeAvgCount = 0
  var waitAvg = 0
  var waitAvgCount = 0
  var readAvg = 0
  var readAvgCount = 0

  Papa.parse(`/data/${csvName}`, {
    download: true,

    step: function (row) {
      let resp = parseFloat(row.data[0])
      if (isNaN(resp)) return

      let offset = parseFloat(row.data[7])

      if (row.data[1] > 0) {
        connAvg += parseFloat(row.data[1])
        connAvgCount++
      }
      if (row.data[2] > 0) {
        dnsAvg += parseFloat(row.data[2])
        dnsAvgCount++
      }
      if (row.data[3] > 0) {
        writeAvg += parseFloat(row.data[3])
        writeAvgCount++
      }
      if (row.data[4] > 0) {
        waitAvg += parseFloat(row.data[4])
        waitAvgCount++
      }
      if (row.data[5] > 0) {
        readAvg += parseFloat(row.data[5])
        readAvgCount++
      }

      if (resp < minValue) minValue = resp
      if (resp > maxValue) maxValue = resp
      if (offset > maxOffset) maxOffset = offset
      respTotal += resp

      if (rawDataCount % dataThin === 0) {
        respChartCfg.data.datasets[0].data.push({ x: offset, y: resp })
      }
      rawDataCount++
    },

    complete: function () {
      document.getElementById('slowest').innerHTML = `${maxValue} secs`
      document.getElementById('fastest').innerHTML = `${minValue} secs`
      document.getElementById('total').innerHTML = `${Math.ceil(maxOffset)} secs  /  ${rawDataCount} req`
      document.getElementById('rate').innerHTML = `${(rawDataCount / maxOffset).toFixed(1)} req/s`

      let binWidth = (maxValue + 1 - Math.max(0, minValue - 1)) / BIN_COUNT

      for (b = 0; b < BIN_COUNT; b++) {
        histChartCfg.data.datasets[0].data[b] = 0
        histChartCfg.data.labels[b] = `${(binWidth * (b + 1)).toFixed(2)}s`
        histChartCfg.data.datasets[0].backgroundColor[b] = `rgb(${(b / BIN_COUNT) * 255}, 30, 200)`
      }

      for (d of respChartCfg.data.datasets[0].data) {
        histChartCfg.data.datasets[0].data[Math.floor(d.y / binWidth)]++
      }

      document.getElementById('avg').innerHTML = `${(respTotal / rawDataCount).toFixed(4)} secs`

      timingChartCfg.data.datasets[0].data[0] = (connAvg / connAvgCount).toFixed(4)
      timingChartCfg.data.datasets[0].data[1] = (dnsAvg / dnsAvgCount).toFixed(4)
      timingChartCfg.data.datasets[0].data[2] = (writeAvg / writeAvgCount).toFixed(4)
      timingChartCfg.data.datasets[0].data[3] = (waitAvg / waitAvgCount).toFixed(4)
      timingChartCfg.data.datasets[0].data[4] = (readAvg / readAvgCount).toFixed(4)

      respChartCfg.options.scales['xAxes'][0].ticks.max = Math.ceil(maxOffset)

      updateGradient(respChart, document.getElementById('resp-chart').getContext('2d'))
      histChart.update()
      timingChart.update()
    },
  })
}

function updateGradient(chart, ctx) {
  let gradientStroke = ctx.createLinearGradient(0, 0, 0, respChart.height)
  gradientStroke.addColorStop(0.0, '#eb1c1c')
  gradientStroke.addColorStop(0.5, '#f0db1d')
  gradientStroke.addColorStop(1.0, '#18e609')
  chart.data.datasets[0].pointBackgroundColor = gradientStroke
  chart.update()
}
