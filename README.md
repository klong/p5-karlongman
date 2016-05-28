##Udacity Front End Developer NanoDegree
##Project 5:
##Neighbourhood Map

####What's needed before you Install?

###npm (Node.js)
your local machine must node.js installed to allow the npm package manager to run:

to check if you already have it installed open a terminal and type:

`npm -v`

 if this returns a version number (like '2.14.1'), you're fine.

 If you get an error instead,  you will have to install Node.js on to the local machine;

* #####[npm homepage](https://www.npmjs.com/)

* #####[Download a Node.js installer](https://nodejs.org/en/download/)


##Install

####clone the git repository to your local machine;

open a terminal where you want to clone to on your local machine
then type:

`git clone "https://github.com/klong/p5-karlongman.git"`

navigate into the 'p5-karlongman' directory

`cd p5-karlongman`

####Installing the required npm packages

the easiest way to add the npm packages is to type in the terminal:

`npm install`

if you are on linux this should complete sucessfully, adding the npm packages to a new folder called `node_modules`
(I developed this on a Fedora 23 laptop)

####After `npm install`  stage completes sucessfully

you will see a new direcory in the repo called `node_modules`

##Serve up the development version

type:

`gulp`

you should see something like this:

<img src="https://cloud.githubusercontent.com/assets/131895/15627953/239e1c24-24ec-11e6-86cc-cde545f56211.jpg" width="1140" height="1195" />


the page should pop-up itself, but if you have problems, use a **google chrome browser** and visit page:

http://localhost:8080/

you can also look at the optimised version of the site using the command;

`gulp serve:dist`

the command ;

`gulp build`

rebuilds the optimized version of the app in the `dist` directory
