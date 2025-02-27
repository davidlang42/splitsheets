#!/bin/bash
#TODO: minify in the future, but keep it verbose now for testing
cp frontend/SplitSheets.js docs/SplitSheets.js
cp frontend/ApiFrames.js docs/ApiFrames.js
#TODO: to aid minification, replace long symbol html names (ids, class names) with short ones (either permanently, or as a find/replace step here, or even use constants in the code)
#TODO: also consider common/long code like document.getElementById
npx minify frontend/SplitSheets.css > docs/SplitSheets.css
npx minify frontend/index.html > docs/index.html