var fs = require('fs');
var del = require('del');
var gulp = require('gulp');
var escape = require('escape-html');
var ghPages = require('gh-pages');
var useref = require('gulp-useref');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var gulpif = require('gulp-if');
var concat = require('gulp-concat');
var minifyCss = require('gulp-minify-css');
var replace = require('gulp-replace');
var runSequence = require('run-sequence');

// ==================================================================
// For publishing to GitHub Pages
// ==================================================================
gulp.task('make-gh-pages', function(cb) {
	runSequence('clean-gh-pages', 'prep-files-gh-pages', 'fix-references-gh-pages', cb);
});

gulp.task('publish-gh-pages', function(cb) {
	runSequence('make-gh-pages', 'deploy-gh-pages', 'clean-gh-pages', cb);
});

gulp.task('clean-gh-pages', function() {
	return del('.gh-pages/');
});

gulp.task('prep-files-gh-pages', function() {
	return gulp.src(['demo/**', 'xivmap.css', 'xivmap.js', 'xivmap-docked.css'])
		.pipe(gulp.dest('.gh-pages/'));
});

gulp.task('fix-references-gh-pages', function() {
	return gulp.src('.gh-pages/index.html')
		.pipe(replace('href="../xivmap.css"', 'href="xivmap.css"'))
		.pipe(replace('href="../xivmap-docked.css"', 'href="xivmap-docked.css"'))
		.pipe(replace('src="../xivmap.js"', 'src="xivmap.js"'))
		.pipe(gulp.dest('.gh-pages/'));
});

gulp.task('deploy-gh-pages', function(cb) {
	ghPages.publish('.gh-pages/', cb);
});

// ==================================================================
// For publishing a downloadable version including documentation
// ==================================================================
gulp.task('make-dist', function(cb) {
	runSequence('clean', ['copy-demo', 'copy-xivmap', 'copy-docs', 'copy-ty-note'], ['minify-js', 'minify-css', 'minify-docked-css'], 'fix-references', cb);
});

gulp.task('clean', function() {
	return del('dist/');
});

gulp.task('copy-demo', function() {
	return gulp.src('demo/**')
		.pipe(gulp.dest('dist/demo/'));
});

gulp.task('copy-xivmap', function() {
	return gulp.src(['xivmap.js', 'xivmap.css', 'xivmap-docked.css'])
		.pipe(gulp.dest('dist/xivmap/'));
});

gulp.task('copy-docs', function() {
	var readme = escape(fs.readFileSync('README.md', {encoding: 'utf8'}));
	readme = readme.replace('![](marketing/xivmap-demo.gif)', '');
	readme = readme.split('# License')[0];
	var assets = useref.assets({noconcat: true});
	return gulp.src('src-docs/MANUAL.html')
		.pipe(replace('{{markdown}}', readme))
		.pipe(assets)
		.pipe(gulpif('*.js', concat('assets/docs.min.js')))
		.pipe(gulpif('*.js', uglify({output: {max_line_len: 200}})))
		.pipe(gulpif('*.css', concat('assets/docs.min.css')))
		.pipe(gulpif('*.css', minifyCss()))
		.pipe(assets.restore())
		.pipe(useref())
		.pipe(gulp.dest('dist/documentation'));
});

gulp.task('copy-ty-note', function() {
	return gulp.src('marketing/thank-you-note/thanks.html')
		.pipe(gulp.dest('dist/'));
});

gulp.task('minify-js', function() {
	return gulp.src('dist/xivmap/xivmap.js')
		.pipe(rename('xivmap.min.js'))
		.pipe(uglify())
		.pipe(gulp.dest('dist/xivmap/'));
});

gulp.task('minify-css', function() {
	gulp.src('dist/xivmap/xivmap.css')
		.pipe(rename('xivmap.min.css'))
		.pipe(minifyCss())
		.pipe(gulp.dest('dist/xivmap/'));
});

gulp.task('minify-docked-css', function() {
	return gulp.src('dist/xivmap/xivmap-docked.css')
		.pipe(rename('xivmap-docked.min.css'))
		.pipe(minifyCss())
		.pipe(gulp.dest('dist/xivmap/'));
});

gulp.task('fix-references', function() {
	return gulp.src('dist/demo/index.html')
		.pipe(replace('href="../xivmap.css"', 'href="../xivmap/xivmap.min.css"'))
		.pipe(replace('href="../xivmap-docked.css"', 'href="../xivmap/xivmap-docked.min.css"'))
		.pipe(replace('src="../xivmap.js"', 'src="../xivmap/xivmap.min.js"'))
		.pipe(gulp.dest('dist/demo/'));
});
