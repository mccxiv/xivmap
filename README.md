# A minimap for websites, a la Sublime Text

![](media/xivmap-demo.gif)

Let's jump right in with an example:

```html
<html>
  <head>
    <title>My Website</title>

     <!-- Include xivmap.css -->
    <link rel="stylesheet" href="xivmap/xivmap.css">

    <link rel="stylesheet" href="css/my-styles.css">
    <script src="js/my-script.js"></script>
  </head>
  <body>
    <h1>Example header<h1>
    <p>Sample content</p>

    <!-- Container div, use the provided positioning and animation classes -->
    <div class="xivmap top-right slide-in"></div>

    <!-- Include xivmap.js and run it -->
    <script src="xivmap/xivmap.js"></script>
    <script> xivmap(); </script>
  </body>
</html>
```

## Files
Xivmap is composed of three files:
- `xivmap.js`
- `xivmap.css`
- `xivmap-docked.css` (optional)

To use Xivmap, you need to add four things to your page: the two required files, a container for xivmap to use, and a line of JavaScript to start it up.

## CSS Classes
You should add one of the positioning classes to your xivmap container, one animation class is also recommended.

###### Positioning classes
`top-right`, `right`, `bottom-right`  
`top-left`, `left`, `bottom-left`

###### Animation classes
`slide-in`, `fade-in`


## Short Instructions
- Include `xivmap.js` as a script tag.
- Include `xivmap.css` as a stylesheet.
- Create a div with the class `xivmap` and one of the positioning classes.
  - Tip: add the class `slide-in` or `fade-in` to it in order to add animations.
  - Tip: place this div near the end of the `<body>` tag, after all your other content. This will make sure that it remains on top. If you don't do this, you might need to add `z-index` values through CSS.
- inside a `<script>`, call the `xivmap()` function.
  - Tip: if this script is placed after the `xivmap` div, you may simply call the function, but if the script comes before the div, such as when it's located in the `<head>` tag, then you'll need to wait for the page to be ready before calling `xivmap()`. See [jQuery .ready()](https://api.jquery.com/ready/) for one way to achieve it.

## Step by step for beginners

Let's add Xivmap to this example page:
```html
<html>
  <head>
    <title>My Website</title>
    <link rel="stylesheet" href="css/my-styles.css">
    <script src="js/my-script.js"></script>
  </head>
  <body>
    <h1>Example header<h1>
    <p>Sample content</p>
  </body>
</html>
```

1. Include the required files. Copy the xivmap folder to the same place where your html file is located.  
CSS should go inside `<head>` and the JavaScript file should be near the end of the page, before the closing `</body>` tag.
```html
<html>
  <head>
    <title>My Website</title>
    <link rel="stylesheet" href="xivmap/xivmap.css"> <!-- XIVMAP'S CSS -->
    <link rel="stylesheet" href="css/my-styles.css">
    <script src="js/my-script.js"></script>
  </head>
  <body>
    <h1>Example header<h1>
    <p>Sample content</p>
    <script src="xivmap/xivmap.js"></script> <!-- XIVMAP'S JAVASCRIPT -->
  </body>
</html>
```

2. Add a container for Xivmap to use, as well as classes for the animation and position on the page. See the Classes section for a complete list of available classes.
```html
<html>
  <head>
    <title>My Website</title>
    <link rel="stylesheet" href="xivmap/xivmap.css">
    <link rel="stylesheet" href="css/my-styles.css">
    <script src="js/my-script.js"></script>
  </head>
  <body>
    <h1>Example header<h1>
    <p>Sample content</p>
    <div class="xivmap top-right slide-in"></div> <!-- XIVMAP'S CONTAINER -->
    <script src="xivmap/xivmap.js"></script>
  </body>
</html>
```

3. Add a script that calls the `xivmap()` function to render the minimap.
```html
<html>
  <head>
    <title>My Website</title>
    <link rel="stylesheet" href="xivmap/xivmap.css">
    <link rel="stylesheet" href="css/my-styles.css">
    <script src="js/my-script.js"></script>
  </head>
  <body>
    <h1>Example header<h1>
    <p>Sample content</p>
    <div class="xivmap top-right slide-in"></div>
    <script src="xivmap/xivmap.js"></script>
    <script> xivmap(); </script> <!-- START XIVMAP! -->
  </body>
</html>
```

## Using Docked Mode
Advanced users, feel free to use your own solution. `xivmap-docked.css` is just one example of the way you can customize the look and feel of your minimap.

1. Include `xivmap-docked.css`
2. Add `xivmap-docked-left` or `xivmap-docked-right` to the `<body>`
3. Create a wrapper around the xivmap container, using the `xivmap-docked-wrapper` class:
```html
<div class="xivmap-docked-wrapper">
  <div class="xivmap top-right"></div>
</div>
```

## Enabling Autohide
Autohide makes it so the minimap only shows when hovered or while scrolling, great for minimalist designs.

Change your `xivmap()` function call to enable autohide:
```javascript
xivmap({autohide: true});
```

## Disabling Accurate Text
Accurate text is a feature that represents text boxes like headings and paragraphs with the true size of the text they contain, instead of the entire box. It is enabled by default.

Turning off accurate text results in a more stylized look which may benefit some minimalist designs.

```javascript
xivmap({accurateText: false});
```

## All Options
Below are the options you may pass to the xivmap function, along with their default values

```javascript
xivmap({
  // Element that will hold the minimap DOM
  minimap: document.querySelector('.xivmap'),

  // CSS selectors for elements that will appear on the minimap
  selectors: xivmap.selectors(),

  // Where to look for the selectors
  context: document.body,

  // Additional elements that will appear in the minimap, even if outside of context
  elements: [],

  // Use text nodes instead of elements, makes text more detailed
  accurateText: true,

  // When accurateText is on, use text nodes for these types of tags
  accurateTextTags: ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P'],

  // Whether to show elements with opacity: 0
  renderNoOpacity: false,

  // Only shows the minimap when hovering or scrolling
  autohide: false,

  // When autohide is on, hide the minimap after this many milliseconds
  autohideDelay: 1500,

  // Refresh itself on the window's load event so that images are included properly.
  refreshOnLoad: true
});
```

## Custom styling
Please look at the `xivmap.css` file, it is fully documented and explains how to modify the way xivmap looks.

Quick example to modify the color of anchor tags on the minimap:  
Note: tag names must be capitalized, as per the JavaScript DOM api.
```css
.xivmap [data-tag="A"] {
  background-color: green;
}
```

# License
© 2015 Andrea Stella

Unfortunately, this is not free software.  
The source code is made available for educational purposes and for non commercial use.