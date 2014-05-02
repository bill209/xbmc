$(function(){
	$('#testclick').click(function(){
		console.log('flipped');
		toggleClass('flipped');
	});
});
console.log('hi');

var app = angular.module('NowPlaying', []);

var defaultImgURL = 'http://4.bp.blogspot.com/-hIirVYTQFRs/TwdWvcq55uI/AAAAAAAACt8/3frSkQULrn4/s320/film-reel.jpg';

// controllers ----------------------------------------------------------

app.controller('mainCtrl', function mainCtrl($scope, xbmcFactory, tmdbFactory, configuration){

	$scope.curMovie = {};
	$scope.curMovie.title = '';
	$scope.curMovie.idx = 0;
	$scope.img = {};
	$scope.img = {'url' : defaultImgURL};
	$scope.tmdbImgPath = tmdbFactory.getImagePath();
//console.log('configuration.sayHello',configuration.sayHello());
// reset the following to a button
	configuration.initialize();

	$scope.setCurMovie = function(title) {
		$scope.curMovie.title = title;
	};
	$scope.setImg = function(url) {
		$scope.img.url = url;
	};
	var promise = xbmcFactory.getMovieCache();
	promise.then(function(movieCache){
		$scope.cache = movieCache;
	});
});

app.controller('profileCtrl',function profileCtrl($scope, rottenTomatoesFactory, tmdbFactory, xbmcFactory){

	$scope.test = function(idx) {
		console.log('test');
		if($scope.flipper == 1){
			$scope.flipper = 0;
		} else {
			$scope.flipper = 1;
		}
	};

//	$scope.rt = {};
	$scope.profile = {};
	$scope.profile.img = {'url' : defaultImgURL};

	$scope.$watch('curMovie.title', function(nv, ov) {
		if(nv == ov) { return; }
		// get rottentomatoes.com info
		var promise = rottenTomatoesFactory.getMovie($scope.curMovie.title);
		promise.then(function(movieInfo) {
			$scope.rt = movieInfo;
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


$( document ).ready(function() {
var card=$('#card');
console.log('ready');
// $('#flip').click(function(){
//   card.toggleClass('flipped');
// });

  });

});

app.controller( 'MovieListCtrl', function MovieListCtrl($scope, $location, $anchorScroll, xbmcFactory, rottenTomatoesFactory) {
	xbmcFactory.setupBookmarks($scope);

	var promise = xbmcFactory.getMovies();
	promise.then(function(movieData){
		$scope.data = movieData;
	});
	$scope.selectMovie = function(idx, title) {
		$scope.setCurMovie(title);
		$scope.selectedRow = idx;
	};
	$scope.highlightMovie = function(idx) {
		$scope.highlightedRow = idx;
	};
	$scope.leaveMovieList = function() {
		$scope.highlightedRow = 'noHighlightedRow';
	};
	$scope.jumpToBM = function(bm){
		if(bm == '#') { bm = 'firstMovie'; }
		var pos = $( "."+bm).position().top - $('#movie0').position().top;
		$('#movieList').animate( {scrollTop: pos}, 2500);
	};
	$scope.getFlags = function(xbmcId){
		return $scope.cache[xbmcId] ? true : false;
	};
});

// services  ----------------------------------------------------------

app.service('configuration', function(xbmcFactory, tmdbFactory) {
	this.sayHello = function() {
		return "Hello, World!";
	};
	this.initialize = function(){
		var i = 0;
		var configArr = [];
		// get the xbmc list
		var promise = xbmcFactory.getMovies();
		promise.then(function(xbmcList){
			$.each(xbmcList, function(){						// loope through the movies
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
});

// factories ----------------------------------------------------------

app.factory('xbmcFactory', function($q, $http) {
	return {
		getMovies: function(){
			var deferred = $q.defer();
			$http
				.get('../xbmc/php/movies_2.json')
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
				.get('../xbmc/php/movieCache.json')
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
console.log(d.data.total);
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
		addTmdbToXbmc: function(xbmcList){
			var deferred = $q.defer();
			$.each(xbmcList, function(){
				var promise = tmdbFactory.getMovie('taken');
				promise.then(function(d){
				});
				getMovie('taken');
			});
		}
	};
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


