# Simple JSONP Content Wrapper

We have a use case (Ionicons) where the browser needs to request svg content which can be loaded cross-origin, or from the `file://` protocol. This project will take a directory(s) of files and wrap file contents in a JSONP callback. This allows the JSONP handler to receive the text cross-origin.


```
import * as jpml from '@ionic/jpml`;


// generate jsonp callback files from a list of directories
jpml.generate({
  // array of all the paths to include
  include: ['some/input/path/'],

  // where all the output files will be saved
  outDir: 'some/output/path',

  // filter function to test which files to generate from
  filter: function(path) {
    // returns true if the path ends with ".svg"
    return path.split('.').pop() === 'svg';
  },

  // function to generate each file's content
  wrapper: function(content, key) {
    return 'loadContent("' + content + '", "' + key + '");'
  }
});
```
