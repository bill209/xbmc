$(function(){
});

var app = angular.module('NowPlaying', []);
var defaultImgURL = 'http://4.bp.blogspot.com/-hIirVYTQFRs/TwdWvcq55uI/AAAAAAAACt8/3frSkQULrn4/s320/film-reel.jpg';
var defaultProfileImg = 'images/movie_reel.png';
var myFirebase = 'https://boiling-fire-3340.firebaseio.com/movies/';
var xbmcMovies = 'php/movies.json';
var xbmcMovieCache = 'php/movieCache.json';
// controllers ----------------------------------------------------------


// at the bottom of your controller

app.controller('mainCtrl', function mainCtrl($scope, xbmcFactory, tmdbFactory, firebaseFactory, configuration){

	$scope.glob = {};
	$scope.glob.fbMovies = {};
	$scope.glob.moviePicks = {};
	$scope.glob.scottPickins = false;  // used for the Scott konami
	$scope.glob.username = '';
	$scope.glob.flipped = false;
	$scope.glob.justMyMovies = false;
	$scope.glob.opacity = true;
	$scope.curMovie = {};
	$scope.curMovie.title = '';
	$scope.curMovie.idx = 0;
	$scope.img = {};
	$scope.img = {'url' : defaultImgURL};
	$scope.tmdb = {};
	$scope.tmdb.movieInfo = {};
	$scope.tmdb.imgPath = tmdbFactory.getImagePath();

// reset the following to a button
	configuration.initialize();
	$scope.glob.posterURLs = configuration.loadPosterURLs();
	$scope.glob.username = ('user',configuration.setUser());
	if($scope.glob.username){
		$scope.glob.scottPickins = true;
	}
	$scope.glob.mobile =  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

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
		var promise = firebaseFactory.getSelectedMoviesByUser($scope.glob.username);
		promise.then(function(movieList) {
			$scope.glob.fbMovies = movieList;
		}, function(reason) {
			alert('Failed: ' + reason);
		});
	};
	$scope.loadFbMovies = function(){
		var promise = firebaseFactory.getSelectedMoviesByUser($scope.glob.username);
		promise.then(function(movieList) {
			$scope.glob.fbMovies = movieList;
			$scope.glob.moviePicks = movieList;
		}, function(reason) {
			alert('Failed: ' + reason);
		});
	};
	var promise = xbmcFactory.getMovieCache(xbmcMovieCache);
	promise.then(function(movieCache){
		$scope.cache = movieCache;
	});

});

app.controller('profileCtrl',function profileCtrl($scope, rottenTomatoesFactory, tmdbFactory, xbmcFactory, firebaseFactory){

//	$scope.rt = {};
	$scope.profile = {};
	$scope.profile.img = {'url' : defaultProfileImg};

// var p = rottenTomatoesFactory.loadPosterURLs();
// p.then(function(posters){
// console.log('p then');
// 		$scope.profile.localPostersURL = posters;
// 		console.log('posters',posters);
// 	}, function(reason) {
// 		alert('Failed: ' + reason);
// 	}
// );
	$scope.removeMovie = function(idx, fbIdx){
		delete $scope.glob.moviePicks[idx];
		firebaseFactory.removeMovie({user: $scope.glob.username, fbIdx: fbIdx});
	};
	$scope.openTMDB = function(movieId){
		window.open("http://www.themoviedb.org/movie/" + movieId,"tmdb");
	};
	$scope.$watch('curMovie.title', function(nv, ov) {
		if(nv == ov) { return; }
		// get rottentomatoes.com info
		var promise = rottenTomatoesFactory.getMovie($scope.curMovie.title);
		promise.then(function(movieInfo) {
			// NOTE*** rottentomatoes api started returning all thumbnails!   6/23/2014
			// NOTE*** now grabbing profile pic from tmdb
//			$scope.profile.img= {'url' : movieInfo.movies[0].posters.original};
//			$scope.setImg(movieInfo.movies[0].posters.original);
		}, function(reason) {
			alert('Failed: ' + reason);
		});
		var promise2 = tmdbFactory.getMovie($scope.curMovie.title);
		promise2.then(function(movieInfo) {
			$scope.tmdb.movieInfo = movieInfo.results[0];
			$scope.profile.img = {'url' : $scope.tmdb.imgPath + movieInfo.results[0].poster_path};
			$scope.setImg($scope.tmdb.imgPath + movieInfo.results[0].backdrop_path);
		}, function(reason) {
			alert('Failed: ' + reason);
		});
	});
});

app.controller( 'MovieListCtrl', function MovieListCtrl($scope, $location, $anchorScroll, xbmcFactory, rottenTomatoesFactory, firebaseFactory) {

	xbmcFactory.setupBookmarks($scope);

	var promise = xbmcFactory.getMovies(xbmcMovies);
	promise.then(function(movieData){
		$scope.data = movieData;
	});
	$scope.selectMovie = function(idx, title) {
		$scope.setCurMovie(title);
		$scope.selectedRow = idx;
	};
	$scope.togglePick=function(idx, title){
		if($scope.glob.moviePicks[idx]){
			firebaseFactory.removeMovie({user: $scope.glob.username, fbIdx: $scope.glob.moviePicks[idx].fbIdx});
			delete $scope.glob.moviePicks[idx];
		} else {
			var id = firebaseFactory.addMovie({user: $scope.glob.username, title: title, idx: idx});
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
	$scope.toggleOpacity=function(){
		$scope.glob.opacity = !$scope.glob.opacity;
	};

});

// services  ----------------------------------------------------------

app.service('configuration', function(xbmcFactory, tmdbFactory, rottenTomatoesFactory, $location) {
	this.sayHello = function() {
		return "Hello, World!";
	};
	this.initialize = function(){
		var i = 0;
		var configArr = [];

		var promise = xbmcFactory.getMovies(xbmcMovies);
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
		return getParameterByName('u');
	};
	this.loadPosterURLs = function(){
		var promise = rottenTomatoesFactory.loadPosterURLs();
		promise.then(function(posters){
				return posters;
			}, function(reason) {
				alert('Failed: ' + reason);
			}
		);
	};
});

// factories ----------------------------------------------------------


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



