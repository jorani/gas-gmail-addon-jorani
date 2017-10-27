# GMail addon for Jorani

The objective of the project is to give live data to GMail users using Jorani. 
An example is the leave request email where we can't show the leave balance of the employee requesting a time off. 
This is because the information presented into the email (which is static) maybe outdated when the manager reads it. 
As shown in the example below (from https://demo.jorani.org/), the addon shows a simplified leave balance report of the employee without having to open the application.

![Example of usage](https://raw.githubusercontent.com/jorani/gas-gmail-addon-jorani/master/docs/images/example.png)

This project can be used in production but it targets advanced users as it requires a lot of setup (detailed instructions are given into the project Wiki).
The plugin is translated into French and English. 

# Installation

Detailed instructions are given into the Wiki. You need to edit the source code (https://script.google.com/) so as to make it use your own Jorani instance.

It includes moifying variables at the top of your script and editing the manifest and add the endpoint prefixes that will be accessed by the script, e.g.:

    "urlFetchWhitelist": [
      "https://demo.jorani.org/api/"
    ],

Refresh GMail after the installation or any in the code.
