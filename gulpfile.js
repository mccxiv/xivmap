var fs = require('fs');
var del = require('del');
var zip = require('gulp-zip');
var gulp = require('gulp');
var escape = require('escape-html');
var useref = require('gulp-useref');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var gulpif = require('gulp-if');
var concat = require('gulp-concat');
var minifyCss = require('gulp-minify-css');
var replace = require('gulp-replace');
var runSequence = require('run-sequence');

// ==================================================================
// For publishing a downloadable version including documentation
// ==================================================================
gulp.task('make-dist', function(cb) {
	runSequence(
		'clean',
		'make-package',
		'make-standalone-demo',
		'clean-folders',
		cb
	);
});

gulp.task('make-package', function(cb) {
	runSequence(['copy-xivmap', 'copy-docs', 'copy-ty-note'], ['minify-js', 'minify-css', 'minify-docked-css'], 'zip-package', cb)
});

gulp.task('make-standalone-demo', function(cb) {
	runSequence(['copy-standalone-demo', 'copy-xivmap-standalone-demo'], 'fix-standalone-demo-references', 'zip-standalone-demo', cb);
});


gulp.task('copy-standalone-demo', function() {
	return gulp.src('demo/**')
		.pipe(gulp.dest('dist/standalone-demo/'));
});

gulp.task('copy-xivmap-standalone-demo', function() {
	gulp.src('dist/xivmap/xivmap/**')
		.pipe(gulp.dest('dist/standalone-demo/xivmap/'))
});

gulp.task('fix-standalone-demo-references', function() {
	return gulp.src('dist/standalone-demo/index.html')
		.pipe(replace('href="../xivmap.css"', 'href="xivmap/xivmap.min.css"'))
		.pipe(replace('href="../xivmap-docked.css"', 'href="xivmap/xivmap-docked.min.css"'))
		.pipe(replace('src="../xivmap.js"', 'src="xivmap/xivmap.min.js"'))
		.pipe(gulp.dest('dist/standalone-demo/'));
});

gulp.task('clean', function() {
	return del('dist/');
});

gulp.task('copy-xivmap', function() {
	return gulp.src(['xivmap.js', 'xivmap.css', 'xivmap-docked.css'])
		.pipe(gulp.dest('dist/xivmap/xivmap/'));
});

gulp.task('copy-docs', function() {
	var readme = escape(fs.readFileSync('README.md', {encoding: 'utf8'}));
	readme = readme.replace('![](publishing-material/xivmap-demo.gif)', '');
	readme = readme.split('# License')[0];
	var assets = useref.assets({noconcat: true});
	return gulp.src('publishing-material/documentation-source-files/MANUAL.html')
		.pipe(replace('{{markdown}}', readme))
		.pipe(assets)
		.pipe(gulpif('*.js', concat('assets/docs.min.js')))
		.pipe(gulpif('*.js', uglify({output: {max_line_len: 200}})))
		.pipe(gulpif('*.css', concat('assets/docs.min.css')))
		.pipe(gulpif('*.css', minifyCss()))
		.pipe(assets.restore())
		.pipe(useref())
		.pipe(gulp.dest('dist/xivmap/documentation'));
});

gulp.task('copy-ty-note', function() {
	return gulp.src('publishing-material/thank-you-note/thanks.html')
		.pipe(gulp.dest('dist/xivmap/'));
});

gulp.task('minify-js', function() {
	return gulp.src('dist/xivmap/xivmap/xivmap.js')
		.pipe(rename('xivmap.min.js'))
		.pipe(uglify())
		.pipe(gulp.dest('dist/xivmap/xivmap/'));
});

gulp.task('minify-css', function() {
	gulp.src('dist/xivmap/xivmap/xivmap.css')
		.pipe(rename('xivmap.min.css'))
		.pipe(minifyCss())
		.pipe(gulp.dest('dist/xivmap/xivmap/'));
});

gulp.task('minify-docked-css', function() {
	return gulp.src('dist/xivmap/xivmap/xivmap-docked.css')
		.pipe(rename('xivmap-docked.min.css'))
		.pipe(minifyCss())
		.pipe(gulp.dest('dist/xivmap/xivmap/'));
});

gulp.task('zip-package', function () {
	return gulp.src(['dist/**', '!dist/standalone-demo', '!dist/standalone-demo/**', '!dist/standalone-demo.zip'])
		.pipe(zip('xivmap.zip'))
		.pipe(gulp.dest('dist/'));
});

gulp.task('zip-standalone-demo', function () {
	return gulp.src('dist/standalone-demo/**/*')
		.pipe(zip('standalone-demo.zip'))
		.pipe(gulp.dest('dist/'));
});

gulp.task('clean-folders', function() {
	return del(['dist/standalone-demo', 'dist/xivmap']);
});