// functions  ----------------------------------------------------------

function convertFbToMl(fb){
	var obj = {};
	for(var key in fb){
		obj[fb[key].idx] = {'fbIdx':key,'title':fb[key].title};
	}
	return obj;
};

// adds the bookmard field to the movie array, the value of which is the first letter of the film for the first film with that starting letter
// note: the first film has a bookmark value of 'firstMovie';
function addBookmarks(movieJson){
	var movieArr = [], articleArr = ['the '], i=0, lastBM = ' ', cc=0, firstLetter = '', currBM = '';
	$.each(movieJson,function(idx){
		movieArr[i] = new Array(2);
		movieArr[i]['title'] = this.title;
		movieArr[i]['movieId'] = this.movieid;
		that = this;
		// search the titles to see if they start with an article
		foundArticleLen = 0;
		$.each(articleArr, function(idx, val){
			var len = val.length, lastBM = '';
			if(that.title.substr(0, len).toLowerCase() == val){
			foundArticleLen = len;
		}
		});

		firstLetter = that.title.substr(foundArticleLen,1);
		charCode = firstLetter.charCodeAt(0);
		currBM = '';
		if(idx === 0) {
			currBM = 'firstMovie';
		} else {
			if(charCode > 64 && charCode < 91){
				if(firstLetter != lastBM){
					currBM = firstLetter;
					lastBM = firstLetter;
				}
			}
		}
		movieArr[i]['idx'] = idx;
		movieArr[i++]['bookmark'] = currBM;
	});
		return movieArr;
}

// scroll box functions
$(function() {
	var ele   = $('#movieList'), speed = 15, scroll = 15, scrolling = '', topRow = 0,  textUp = 1;
	var rowHeight = 41; //$('#movie0').outerHeight() - 1;  ** not defined yet
	$('#scrollUp').mouseenter(function() {
		// Scroll the element up
		textUp = -1;
		scrolling = window.setInterval(function() {
			ele.scrollTop( ele.scrollTop() - scroll );
		}, speed);
	});

	$('#scrollDn').mouseenter(function() {
		// Scroll the element down
		textUp = 1;
		var lastScrollableRow = $('#movieList li').length - Math.floor($('#movieList').height() / rowHeight);

		scrolling = window.setInterval(function() {
			ele.scrollTop( ele.scrollTop() + scroll );
		}, speed);
	});

	$('#scrollUp, #scrollDn').bind({
		click: function(e) {
			// Prevent the default click action
			e.preventDefault();
		},
		mouseleave: function() {
			if (scrolling) {
				// this loop scrolls to the next movie break
				while($('#movie0').position().top % rowHeight  !== 0){
					ele.scrollTop( ele.scrollTop() + (1 * textUp));
				}
				window.clearInterval(scrolling);
				scrolling = false;
			}
		}
	});
});

function getParameterByName(name) {
	name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
	var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
		results = regex.exec(location.search);
	return results == null ? false : decodeURIComponent(results[1].replace(/\+/g, " "));
}

// a little routine just to change the bg image of the container to the bcbsnc mms home page.
// var init = function () {
// 	if(getParameterByName('bcbsnc')){
// 		defaultImgURL = 'images/bcbsnc.png';
// 	};
// };
// init();

