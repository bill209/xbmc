$(function(){
});

var app = angular.module('NowPlaying', []);
var defaultImgURL = 'http://4.bp.blogspot.com/-hIirVYTQFRs/TwdWvcq55uI/AAAAAAAACt8/3frSkQULrn4/s320/film-reel.jpg';
var defaultProfileImg = 'images/movie_reel.png';
var myFirebase = 'https://boiling-fire-3340.firebaseio.com/movies/';
// controllers ----------------------------------------------------------

app.controller('mainCtrl', function mainCtrl($scope, xbmcFactory, tmdbFactory, movieListFactory, configuration){

	$scope.glob = {};
	$scope.glob.fbMovies = {};
	$scope.glob.moviePicks = {};
	$scope.glob.scottPickins = false;  // used for the Scott konami
	$scope.glob.username = 'bill';
	$scope.glob.flipped = false;
	$scope.curMovie = {};
	$scope.curMovie.title = '';
	$scope.curMovie.idx = 0;
	$scope.img = {};
	$scope.img = {'url' : defaultImgURL};
	$scope.tmdbImgPath = tmdbFactory.getImagePath();

// reset the following to a button
	configuration.initialize();
	$scope.glob.username = ('user',configuration.setUser());
	if($scope.glob.username){
		$scope.glob.scottPickins = true;
	}

	$scope.$watch('glob.scottPickins', function() {
		if($scope.glob.scottPickins){
			$scope.loadFbMovies();
		}
	});

	$scope.setCurMovie = function(title) {
		$scope.curMovie.title = title;
	};
	$scope.setImg = function(url) {
		$scope.img.url = url;
	};
	$scope.getMovieList = function(){
		var promise = movieListFactory.getSelectedMovies($scope.glob.username);
		promise.then(function(movieList) {
			$scope.glob.fbMovies = movieList;
		}, function(reason) {
			alert('Failed: ' + reason);
		});
	};
	$scope.loadFbMovies = function(){
		var promise = movieListFactory.getSelectedMovies($scope.glob.username);
		promise.then(function(movieList) {
			$scope.glob.fbMovies = movieList;
			$scope.glob.moviePicks = movieList;
		}, function(reason) {
			alert('Failed: ' + reason);
		});
	};
	var promise = xbmcFactory.getMovieCache();
	promise.then(function(movieCache){
		$scope.cache = movieCache;
	});

});

app.controller('profileCtrl',function profileCtrl($scope, rottenTomatoesFactory, tmdbFactory, xbmcFactory, movieListFactory){

//	$scope.rt = {};
	$scope.profile = {};
	$scope.profile.img = {'url' : defaultProfileImg};

	$scope.removeMovie = function(idx, fbIdx){
		delete $scope.glob.moviePicks[idx];
		movieListFactory.removeMovie({user: $scope.glob.username, fbIdx: fbIdx});
	};
	$scope.flipIt = function(){
//		$('ul#selectedMovieList').css('overflow-y','scroll');
	};
	$scope.$watch('curMovie.title', function(nv, ov) {
		if(nv == ov) { return; }
		// get rottentomatoes.com info
		var promise = rottenTomatoesFactory.getMovie($scope.curMovie.title);
		promise.then(function(movieInfo) {
			$scope.profile.img= {'url' : movieInfo.movies[0].posters.original};
//			$scope.setImg(movieInfo.movies[0].posters.original);
		}, function(reason) {
			alert('Failed: ' + reason);
		});

		var promise2 = tmdbFactory.getMovie($scope.curMovie.title);
		promise2.then(function(movieInfo) {
			$scope.setImg($scope.tmdbImgPath + movieInfo.results[0].poster_path);
		}, function(reason) {
			alert('Failed: ' + reason);
		});
	});
});

app.controller( 'MovieListCtrl', function MovieListCtrl($scope, $location, $anchorScroll, xbmcFactory, rottenTomatoesFactory, movieListFactory) {
	xbmcFactory.setupBookmarks($scope);

	var promise = xbmcFactory.getMovies();
	promise.then(function(movieData){
		$scope.data = movieData;
	});
	$scope.selectMovie = function(idx, title) {
		$scope.setCurMovie(title);
		$scope.selectedRow = idx;
	};
	$scope.togglePick=function(idx, title){
		if($scope.glob.moviePicks[idx]){
			movieListFactory.removeMovie({user: $scope.glob.username, fbIdx: $scope.glob.moviePicks[idx].fbIdx});
			delete $scope.glob.moviePicks[idx];
		} else {
			var id = movieListFactory.addMovie({user: $scope.glob.username, title: title, idx: idx});
			$scope.glob.moviePicks[idx] = {'fbIdx':id, 'title':title};
		}
	};
	$scope.highlightMovie = function(idx) {
		$scope.highlightedRow = idx;
	};
	$scope.leaveMovieList = function() {
		$scope.highlightedRow = 'noHighlightedRow';
	};
	$scope.jumpToBM = function(bm){
		// set flag for scott
		if(($scope.curMovie.title=='Admission' || $scope.curMovie.title=='Captain America: The First Avenger') && bm == 'S'){
			$scope.glob.scottPickins = true;
			$scope.glob.username = 'scott';
		} else if(($scope.curMovie.title=='Admission' || $scope.curMovie.title=='Jiro Dreams of Sushi') && bm == 'J'){
			$scope.glob.scottPickins = true;
			$scope.glob.username = 'josh';
		} else {
		// jump to bookmark
			$scope.curMovie.BM = bm;   // used for the Scott konami
			if(bm == '#') { bm = 'firstMovie'; }
			var pos = $( "."+bm).position().top - $('#movie0').position().top;
			$('#movieList').animate( {scrollTop: pos}, 2500);
		}
	};
	$scope.getFlags = function(xbmcId){
		return $scope.cache[xbmcId] ? true : false;
	};
});

app.controller( 'FooterCtrl', function FooterCtrl($scope) {

});

// services  ----------------------------------------------------------

app.service('configuration', function(xbmcFactory, tmdbFactory,$location) {
	this.sayHello = function() {
		return "Hello, World!";
	};
	this.initialize = function(){
		var i = 0;
		var configArr = [];

		var promise = xbmcFactory.getMovies();
		promise.then(function(xbmcList){
			$.each(xbmcList, function(){						// loop through the movies
				configArr[this.movieId] = this;
				var that = this;
				if(i++ > 3){ return false; }
				// get the tmdb movie data for each movie
				var promise = tmdbFactory.getMovie(this.title);
				promise.then(function(tmdbMovie){
					configArr[that.movieId]['tmdb'] = tmdbMovie;
				});
			});
		});
	};
	this.setUser = function(){
		if(location.search.indexOf('u=') != -1){
		 	return location.search.slice(3);
		} else {
			return false;
		}
	};
});

// factories ----------------------------------------------------------

app.factory('xbmcFactory', function($q, $http) {
	return {
		getMovies: function(){
			var deferred = $q.defer();
			$http
				.get('php/movies.json')
				.then(function(d){
					var movieData = addBookmarks(d.data.result.movies);
					deferred.resolve(angular.fromJson(movieData));
				});
			return deferred.promise;
		},
		setupBookmarks: function(scope){
			scope.alphabet = ['#','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O', 'P','R','S','T','U','V','W','X','Y','Z'];
		},
		getMovieCache: function(){
			var deferred = $q.defer();
			$http
				.get('php/movieCache.json')
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
		getMovie: function(movie) {
			var deferred = $q.defer();
			var findMovie = tmdbLinks.getMovieByName.replace('[movietitle]', movie.replace(' ','+'));
			$http
				.jsonp(findMovie)
				.then(function(d) {
					deferred.resolve(d.data);
				});
			return deferred.promise;
		},
		getImagePath: function(){
			return 'http://d3gtl9l2a4fn1j.cloudfront.net/t/p/original/';
		},
	};
});

app.factory('movieListFactory', function ($q, $http) {
	var fb = new Firebase(myFirebase);
	return {
		removeMovie: function(data) {
			var ref=new Firebase(myFirebase + data.user + '/' + data.fbIdx);
			ref.remove();
		},
		addMovie: function(data) {
			var ref=new Firebase(myFirebase + data.user );
			newRef = ref.push({'idx':data.idx,'title':data.title});
			return newRef.name();
		},
		getSelectedMovies: function(username){
			var deferred = $q.defer();
			$http
				.get(myFirebase + username + '.json')
				.then(function(d){
					if(d.data!=='null') {
						var obj = convertFbToMl(d.data);
					} else {
						var obj = {};
					}
					deferred.resolve(obj);
				});
			return deferred.promise;
		}
	}
});

// directives ----------------------------------------------------------

app.directive('NOT_USED_mySelectFirstMovie', function() {
	return function(scope, element, attrs) {
		if (scope.$first){
			element.addClass('xxxxxxx');
		}
	};
});




// I provide a "Fade" overlay for the primary image whenever
// the primary image source changes. This allows for a "softer"
// transition from image to image.
app.directive(
	"bnFadeHelper",
	function() {
		// I alter the DOM to add the fader image.
		function compile( element, attributes, transclude ) {
			element.prepend( "<img class='fader' />" );
			return( link );
		}

		// I bind the UI events to the $scope.
		function link( $scope, element, attributes ) {

			var fader = element.find( "img.fader" );
			var primary = element.find( "img.image" );

			// Watch for changes in the source of the primary
			// image. Whenever it changes, we want to show it
			// fade into the new source.
			$scope.$watch(
				"profile.img.url",
				function( newValue, oldValue ) {
					// If the $watch() is initializing, ignore.
					if ( newValue === oldValue ) {
						return;
					}
					// If the fader is still fading out, don't
					// bother changing the source of the fader;
					// just let the previous image continue to
					// fade out.
					if ( isFading() ) {
						return;
					}
					initFade( oldValue );
				}
			);

			// I prepare the fader to show the previous image
			// while fading out of view.
			function initFade( fadeSource ) {
				fader
					.prop( "src", fadeSource )
					.addClass( "show" )
				;
				// Don't actually start the fade until the
				// primary image has loaded the new source.
				primary.one( "load", startFade );
			}

			// I determine if the fader is currently fading
			// out of view (that is currently animated).
			function isFading() {
				return(
					fader.hasClass( "show" ) ||
					fader.hasClass( "fadeOut" )
				);
			}

			// I start the fade-out process.
			function startFade() {
				// The .width() call is here to ensure that
				// the browser repaints before applying the
				// fade-out class (so as to make sure the
				// opacity doesn't kick in immediately).
				fader.width();
				fader.addClass( "fadeOut" );
				setTimeout( teardownFade, 250 );
			}

			// I clean up the fader after the fade-out has
			// completed its animation.
			function teardownFade() {
				fader.removeClass( "show fadeOut" );
			}
		}

		// Return the directive configuration.
		return({
			compile: compile,
			restrict: "A"
		});

	}
);

// this limits the number of characters displayed on the page
// usage: {{some_text | cut:true:100:' ...'}}
// options:  wordborders (boolean) - if true, cut only on word boundaries
//			max (integer) - maximum length of string
//			tail (string, default = '...') - add this string to any truncated text

app.filter('cut', function () {
        return function (value, wordwise, max, tail) {
            if (!value) return '';

            max = parseInt(max, 10);
            if (!max) return value;
            if (value.length <= max) return value;

            value = value.substr(0, max);
            if (wordwise) {
                var lastspace = value.lastIndexOf(' ');
                if (lastspace != -1) {
                    value = value.substr(0, lastspace);
                }
            }

            return value + (tail || ' …');
        };
    });



