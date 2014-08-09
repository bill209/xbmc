app.factory('firebaseFactory', function ($q, $http) {
	return {
		removeMovie: function(data) {
			// data: {user: $scope.glob.username, fbIdx: fbIdx}
			var fb = new Firebase(myFirebase);
			var ref=new Firebase(myFirebase + data.user + '/' + data.fbIdx);
			ref.remove();
		},
		addMovie: function(data) {
			//data: {user: $scope.glob.username, title: title, idx: idx
			var fb = new Firebase(myFirebase);
			var ref=new Firebase(myFirebase + data.user );
			newRef = ref.push({'idx':data.idx,'title':data.title});
			return newRef.name();
		},
		addMovie2: function(data){
		//data (all info from tmdb): + xbmcID
		// 	{from tmdb: id, adult, backdrop_path, original_title, release_date, poster_path:, popularity, title, vote_average:, vote_count}
			var fb = new Firebase(myFirebase);
			var ref=new Firebase(myFirebase + data.title );
			newRef = ref.push({'tmdbId':data.tmdbId,'results':data.results});
			return newRef.name();

		},
		getSelectedMoviesByUser: function(username){
			//data: $scope.glob.username
			var fb = new Firebase(myFirebase);
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


