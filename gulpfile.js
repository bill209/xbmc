var 	gulp = require('gulp'),
	livereload = require('gulp-livereload'),
	watch = require('gulp-watch')
	uglify = require('gulp-uglify');

gulp.task('watch', function() {
	gulp.src(['js/**/*.js', '*.htm'])
		.pipe(watch())
//		.pipe(uglify({mangle:false}))
//		.pipe(gulp.dest('dist'))
		.pipe(livereload());
});

gulp.task('compress', function() {
	gulp.src(['js/*.js'])
		.pipe(watch())
		.pipe(uglify({mangle:false}))
		.pipe(gulp.dest('dist'))
//		.pipe(livereload());
});

gulp.task('default',['watch','compress']);

