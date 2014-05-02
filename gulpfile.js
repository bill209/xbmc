var 	gulp = require('gulp'),
	livereload = require('gulp-livereload'),
	watch = require('gulp-watch'),
	uglify = require('gulp-uglify');

gulp.task('compress', function(){
	return gulp.src('js/*.js')
		.pipe(uglify({mangle:false}))
		.pipe(gulp.dest('dist'));
});

gulp.task('livereload', function(){
	return gulp.src(['js/**/*.js','*.htm'])
		.pipe(watch())
		.pipe(livereload());
});

gulp.task('watch', function(){
	gulp.watch('js/*.js', ['compress']);
	gulp.watch(['livereload']);
});

gulp.task('default',['watch','compress','livereload']);

