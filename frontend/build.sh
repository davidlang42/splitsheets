#!/bin/bash
#TODO: to aid minification, replace long symbol html names (ids, class names) with short ones (either permanently, or as a find/replace step here, or even use constants in the code)
#TODO: minify in the future, but keep it verbose now for testing
#npx minify SplitSheets.js > ../docs/SplitSheets.js
cp SplitSheets.js ../docs/SplitSheets.js
npx minify SplitSheets.css > ../docs/SplitSheets.css
npx minify index.html > ../docs/index.html