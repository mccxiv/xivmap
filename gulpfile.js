var del = require('del');
var gulp = require('gulp');
var ghPages = require('gh-pages');
var runSequence = require('run-sequence');

gulp.task('prep-files-gh-pages', function() {
	return gulp.src(['demo/**', 'index.html', 'xivmap.css', 'xivmap.js'], {base: './'})
		.pipe(gulp.dest('.ghpages'));
});

gulp.task('deploy-gh-pages', function(cb) {
	ghPages.publish('.ghpages', cb);
});

gulp.task('clean-up-gh-pages', function() {
	return del('.ghpages');
});

gulp.task('gh-pages', function(cb) {
	runSequence('clean-up-gh-pages', 'prep-files-gh-pages', 'deploy-gh-pages', 'clean-up-gh-pages', cb);
});

gulp.task('package', function(cb) {
	runSequence('clean-packaged', 'copy-demo', 'copy-xivmap', cb);
});

gulp.task('clean-packaged', function() {
	return del('packaged/');
});

gulp.task('copy-demo', function() {
	return gulp.src(['demo/**', '!demo/xivmap-demo.gif', '!demo/xivmap-demo.mp4'])
		.pipe(gulp.dest('packaged/demo/'));
});

gulp.task('copy-xivmap', function() {
	return gulp.src(['xivmap.js', 'xivmap.css', 'xivmap-docked.css'])
		.pipe(gulp.dest('packaged/xivmap/'));
});