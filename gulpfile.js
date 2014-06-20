var 	gulp = require('gulp');
var	uglify = require('gulp-uglify');

gulp.task('connect', function(){
	var connect = require('connect'),
		app = connect()
			.use(require('connect-livereload')({port: 35729}))
			.use(connect.static(__dirname));

	require('http').createServer(app)
		.listen(9000)
		.on('listening', function(){
			console.log('connected to port 9000');
	});
});

// this task cranks up the browser and opens a new window
gulp.task('serve', ['connect'], function() {
//	require('opn')('http://localhost:9000');
});

gulp.task('compress', function(){
	return gulp.src('js/*.js')
//		.pipe(uglify({mangle:false}))
		.pipe(gulp.dest('dist'));
});

gulp.task('watch', ['connect', 'serve'], function() {
	var livereload = require('gulp-livereload'),
		server = livereload();

	gulp.watch('js/*.js', ['compress']);

	gulp.watch(['dist/*.js','*.html','views/*.html', 'css/*.css']).on('change', function(file) {
		server.changed(file.path);
	});
});


gulp.task('default',['watch','compress']);

