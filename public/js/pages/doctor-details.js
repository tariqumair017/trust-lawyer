//[Dashboard Javascript]

//Project:	Law Firm - Responsive Admin Template
//Primary use:   Used only for the main dashboard (index.html)


$(function () {

  'use strict';
	
	
	// Slim scrolling
  	$('.inner-user-div').slimScroll({
		height: '350px'
	  });
  
	  $('.inner-user-div4').slimScroll({
		height: '350px'
	  });
	
	var datepaginator = function() {
		return {
			init: function() {
				$("#paginator1").datepaginator()
			}
		}
	}();
	jQuery(document).ready(function() {
		datepaginator.init()
	}); 
	
	
	$('.inner-user-div3').slimScroll({
			height: '200px'
	    });
	
	var options = {
			series: [{
			name: 'Cases',
			data: [4, 3, 10, 9, 50, 19, 22, 9, 17, 2, 7, 15]
		}],
			chart: {
				width: 200,
			toolbar: {
				show: false,
			},
			height: 120,
			type: 'line',
		},
		stroke: {
			width: 4,
			curve: 'smooth',
			colors: ['#1dbfc1']
		},

		legend: {
			show: false
		},
		tooltip: {
			enabled: true,
		},

		grid: {
	show: false,
	},

		xaxis: {
			show: false,
			lines: {
				show: false,
			},
			labels: {
				show: false,
			},
			axisBorder: {
			  show: false,
			},

		},
		yaxis: {
			show: false,
		},
	};

	var chart = new ApexCharts(document.querySelector("#chart"), options);
	chart.render();
		
	
}); // End of use strict
