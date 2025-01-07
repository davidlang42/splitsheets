# SplitSheets
A web app which uses Google Sheets to track splitting shared costs between friends.

The costs are only stored in Google Sheets, and its up to you which other users you share each Google Sheet with.
There is a small amount of metadata stored in the Google Apps Script Properties Service, but this is per user.

The backend is hosted directly on Google Apps Script, with a frontend hosted by GitHub Pages, free for anyone to use: https://splitsheets.davidlang.net

But by all means, [buy me a coffee](https://ko-fi.com/davidlang42).

## Set up local repo
* Clone git repo: `git clone https://github.com/davidlang42/splitsheets.git`
* Install [clasp](https://developers.google.com/apps-script/guides/clasp): `npm install @google/clasp -g`
* Login to clasp: `clasp login`
* Enter backend directory: `cd backend`
* Connect apps script project: `clasp clone [scriptId]`

## Deploying changes
### Use bash script
* Run from the root of the repo: `./deploy.sh`
  * Warning: This will overwrite any changes made directly on google apps scripts, but they will still exist in a reverted commit labelled 'possible lost changes'
### Execute manually
* Enter app directory: `cd backend`
* Pull changes to local git repo: `git pull`
* Push changes to apps scripts: `clasp push`
  * Warning: This will overwrite any changes made directly on google apps scripts
* Find existing deployment: `clasp deployments`
  * Returns deployment id: `- AKfycbxSDJouDbOKVTQ3cnnGaJaLW5EbR86YRTwCX-PJb7Mvua9egDM @58 - Test via Clasp`
* Create version & update existing deployment: `clasp deploy -i [deploymentId] -d "[description]"`

## Hardcoded details
TBA where the app url is hard coded

## Future features
See GitHub [issues](https://github.com/davidlang42/splitsheets/issues) for a list of new enhancement or known bugs.

Feel free to also work on these features/ bug fixes and submit a [pull request](https://github.com/davidlang42/splitsheets/pulls).
