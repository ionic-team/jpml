# JSONP Markup Language

We have a use case (Ionicons) where we need to request svg/html/xml content which can be loaded cross-origin or from the `file://` protocol. So at build time, this project will take `svg` content and convert it into `json`, then wrap it in a JSONP callback. This allows the JSONP handler to receive the text and parse the JSON context, then generate HTML/SVG from the data. Because the handler is not using `innerHTML`, and the data is sent as `json`, we're able to validate, create and insert only safe elements at runtime. Long story short: Safely load SVGs, to include cross-origin, and dynamically (safely) generate `<svg>` elements with inner elements which can be styled via CSS.


```
import * as jpml from '@ionic/jpml`;


// parse a list of directories
jpml.parseDirectories({
  // array of all the paths to include
  include: ['some/input/path/'],

  // where all the output files will be saved
  outDir: 'some/output/path,

  // filter function to test which files to parse
  filter: function(path) {
    // returns true if the path ends with ".svg"
    return path.split('.').pop() === 'svg';
  }
});


// just parse just content
jpml.parse({
  contentText: '<svg></svg>',
  contentKey: 'my-file.svg'
}).then(jsonp => {
  console.log(jsonp);

  // loadJpml({svg:[]},'my-file.svg'});
})
```
