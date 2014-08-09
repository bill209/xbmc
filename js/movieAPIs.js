app.factory('xbmcFactory', function($q, $http) {
	return {
		getMovies: function(movies){
			var deferred = $q.defer();
			$http
				.get(movies)
				.then(function(d){
					var movieData = addBookmarks(d.data.result.movies);
// var newMovieIdx = movieData.length;
// movieData[newMovieIdx] = { 'bookmark' : '', 'idx' : '0', 'movieId' : '0' , 'title' : 'scotts special movie' }
					deferred.resolve(angular.fromJson(movieData));
				});
			return deferred.promise;
		},
		setupBookmarks: function(scope){
			scope.alphabet = ['#','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O', 'P','R','S','T','U','V','W','X','Y','Z'];
		},
		getMovieCache: function(movieCache){
			var deferred = $q.defer();
			$http
				.get(movieCache)
				.then(function(d){
					var movieCache =[];
					$.each(d.data.result.movies, function(){				// convert json to associative array
						movieCache[this.xbmcId] = [];				// xbmc ID is key
						movieCache[this.xbmcId]['tmdbId'] = this.tmdbId;
					});
					deferred.resolve(movieCache);
				});
			return deferred.promise;
		}
	};
});
app.factory('tmdbFactory', function ($q, $http) {
	var APIKEY =  '829f2c4b8c9c5304ea86fc7cf47b1053';
	var tmdbLinks = {
		"getMovieByName" :  "http://api.themoviedb.org/3/search/movie?api_key=829f2c4b8c9c5304ea86fc7cf47b1053&query=[movietitle]&callback=JSON_CALLBACK"
//		&append_to_response=releases,trailers
	};
	return {
		getMovie: function(title) {
			var deferred = $q.defer();
			var findMovie = tmdbLinks.getMovieByName.replace('[movietitle]', title.replace(' ','+'));
			$http
				.jsonp(findMovie)
				.then(function(d) {
					deferred.resolve(d.data);
				});
			return deferred.promise;
		},
		getImagePath: function(){
			return 'http://image.tmdb.org/t/p/original';
//			return 'http://d3gtl9l2a4fn1j.cloudfront.net/t/p/original';
		},
	};
});

app.factory('rottenTomatoesFactory', function ($q, $http) {
	var rtLinks = {
		"getMovie" : "http://api.rottentomatoes.com/api/public/v1.0/movies.json?apikey=jq7aydjmufspr54dcffw7f66&q=[movietitle]&page_limit=1&callback=JSON_CALLBACK"
	};
	return {
		getMovie: function(movie) {
			var deferred = $q.defer();
			var findMovie = rtLinks.getMovie.replace('[movietitle]', movie);
			$http
				.jsonp(findMovie)
				.then(function(d) {
					if(d.data.total == 0){
						d.data.movies[0].posters.original = defaultImgURL;
					}
					deferred.resolve(d.data);
				});
			return deferred.promise;
		},
		loadPosterURLs: function(movie) {
			var deferred = $q.defer();
			$http
				.get('php/posters.json')
				.then(function(d) {
					deferred.resolve(d.data);
				});
			return deferred.promise;
		},
	};
});



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
