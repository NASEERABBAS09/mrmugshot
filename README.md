# Lawdawgs
## Directory Structure
The application will have the following directory structure:

```sh
lawdawgs/
  .meteor/
  client/                  # Client folder
    components/            # Contains all components
    config/                # Configuration files (on the client)
      routes.js
    directives/            # Contains all directives
    filters/               # Contains all custom filters
    lib/                   # Library files (modules, plugins....) -- maybe include css files
      modules/
      plugins/
      app.js
    services/              # Contains all services/factories
    styles/                # Contains all custom styles
    index.html             # main html page
  lib/                     # Library files that get executed first
    models/                # Model files, for each Meteor.Collection
  packages/                # Used for local packages - not loaded as part of app code
  public/                  # Public files
    assets/                # Image assets
    ga.js                  # google analytics setup
  resources/               # Icon and splash for mobile app
    icons/
    splash/
  server/                  # Server folder
    config/                # Configuration files (on the server)
    lib/                   # Server side library folder
    publications/          # Collection publications
    startup/               # On server startup
  .gitignore               # add to this gitignore for ignoring
  bower.json               # add to this bower file or use bower install
  mobile-config.js
  packages.json            # add to this npm file or use npm install
  README.md
  run.sh
  settings.json            # Meteor.settings file
```