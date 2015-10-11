var del = require('del');
var gulp = require('gulp');
var ghPages = require('gh-pages');
var runSequence = require('run-sequence');

gulp.task('prep-files-gh-pages', function() {
	return gulp.src(['demos/**', 'index.html', 'xivmap.css', 'xivmap.js'], {base: './'})
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