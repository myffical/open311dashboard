/**
 * Histogram of (closed time - expected time) for closed issues for aa given Open311 Dashboard
 *
 *
 * Depends:
 *   jquery.ui.core.js
 *   jquery.ui.widget.js
 */
(function( $, undefined ) {

$.widget('Open311.barchartGoogleResponseTime', $.Open311.barchartGoogle, {
  /**
   * Default options for the widget.  We need some way
   * of communicating the data source across all widgets.
   */
  options: {
    title: 'Open311 Response Time'
 },
     /**
   * Creation code for widget
   */
  _create: function() {
    var self = this;
    self._bindEvents();
        // Create container to put chart in.
    this.updateContent('');

  },
  
  _bindEvents: function(){
    var self = this;
    
    $($.Open311).bind('open311-data-update', function(event, data){
      self._render(data);
    });

  },
  _roundToDay: function(datetime){
      var date = new Date(datetime.getFullYear(), datetime.getMonth(), datetime.getDate());
      return date;
  },
  
  _render: function(data) {
    var day_length = 1000 * 60 * 60 * 24;
    var week_length = day_length * 7;
    var self = this;
    var num_requests = data.service_requests.length;
    var response_counter = {};
    if(num_requests > 0){
        for(var i = 0; i < num_requests; i++){
            var service_request = data.service_requests[i];
            if(service_request.status !== "Closed") continue;
            if(!service_request.expected_datetime || !service_request.updated_datetime) continue;

            var expected_datetime_string = service_request.expected_datetime;
            var expected_datetime = new Date(expected_datetime_string);
            if(!expected_datetime) continue;    //Back off if cannot parse date
            var expected_date = self._roundToDay(expected_datetime);

            var updated_datetime_string = service_request.updated_datetime;
            var updated_datetime = new Date(updated_datetime_string);
            if(!updated_datetime) continue;    //Back off if cannot parse date
            var updated_date = self._roundToDay(updated_datetime);

            // Positive indicates late, negative indicates early
            var response_time = updated_date - expected_date;

            // Integer, number of days late, rounds to earlier day
            var response_days = response_time / day_length;
            
            if(!response_counter[response_days]){
                response_counter[response_days] = 1;
            }
            else{
                response_counter[response_days]++;
            }
        }
    
    
			  // Parameters for the chart
 			 	var chart = {
		        title: "Closed Requests by Response Time",
		        width: 720,
		        height: 200,
		        type: "bvg",
		        color: "1d8dc3"
		    };
  
        /*
http://chart.apis.google.com/chart
   ?chxl=1:|November|March
   &chxr=0,0,1100|1,5,100
   &chxs=1,676767,11.5,0,_,676767
   &chxt=y,x
   &chbh=a
   &chs=300x225
   &cht=bvg
   &chco=A2C180
   &chds=0,1016.667
   &chd=t:1000,385
   &chma=|0,2
      */

	      // Create google chart data
		    var params = ['http://chart.apis.google.com/chart'];
		    params.push("?chxs=1,676767,11.5,0,_,676767");
		    params.push("&chxt=x,y&chbh=a");
		    params.push("&chs=" + chart.width + "x" + chart.height);
		    params.push("&cht=" + chart.type);
		    params.push("&chco=" + chart.color);

		    var dataPar = [],
		      axis = [],
		      dataLabels = [],
	      	maxValue = 0;
        
        var bins = Object.keys(response_counter);
        bins = bins.sort(function(a, b) {return parseInt(a) - parseInt(b)});
        var min_bin = bins[0];
        var max_bin = bins[bins.length - 1]
        
        for (var i = min_bin; i <= max_bin; i++) {
            if(!response_counter[i]){
                dataPar.push(0);
            }
            else{
                axis.push(i);
                var data_point = response_counter[i];
                dataPar.push(data_point);
                if (data_point > maxValue) {
                  maxValue = data_point;
                }
            }
        }
			
		    params.push("&chds=0," + maxValue + "&chxr=0,0,0|1,0," + maxValue);
		    params.push("&chd=t:" + dataPar.join(','));
		    
		    params.push("&chxl=0:|" + axis.join('|'));
		    
		    var reverseDataLabels = dataLabels.reverse();
		    params.push("&chm=" + reverseDataLabels.join('|'));
  
		    // Add image to widget
		    self.updateContent('<img src="' + params.join('') + '"></img>');
	    } else {
		    self.updateContent('No data found');
		  }
  },
  
  /**
   * Destroy widget
   */
  destroy: function() {
    // Default destroy
    $.Widget.prototype.destroy.apply(this, arguments);
  }
});

})( jQuery );

