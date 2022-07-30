# jetlag.gg 3D Multiplayer Angular Game - frontend part
[![GPLv3 license](https://img.shields.io/badge/License-GPLv3-blue.svg)](http://perso.crans.org/besson/LICENSE.html)

This readme provides information about the frontend part of the jetlag.gg game and includes explanation of used technologies and concepts.

## Table of Contents
* [General Information](#general-information)
* [Project structure](#project-structure)
* [Technologies Used](#technologies-used)
* [Local Setup](#local-setup)
* [Room for Improvement](#room-for-improvement)
* [Acknowledgements](#acknowledgements)
* [Contact](#contact)
* [License](#license)


## General Information
The frontend of the jetlag.gg game was created with use of latest Angular 14 and has modular structure. The main objective is to effectively communicate with backend websocket and rest API and render, animate and control the world and players.


## Project structure
Project is build up on lazy loaded modules which are divided by feature and process and include:
- [Auth Module](src/app/auth) - Logic, views and guards required for the registration process
- [Game Module](src/app/game) - The main game views and logic
  - [Game intro Module](src/app/game/game-intro) - The game intro view and required services
  - [Game 3D Module](src/app/game/game-3d) - 3D game elements and camera handling
  - [Game cockpit](src/app/game/game-cockpit) - 2D game elements (player, airport tables, cockpit elements) and logic
  - [Game over](src/app/game/game-over) - After game over screen with leaderboard functionality 
  - [Game shared](src/app/game/game-shared) - Components, pipes, utils and models used within other game modules 
- [Shared Module](src/app/shared) - Shared utils which include layout components abstract websocket handler and other utils


## Technologies Used
- [Angular 14](https://github.com/angular/angular)
- [RxJS 7.5](https://github.com/ReactiveX/rxjs)
- [Angular Three](https://github.com/nartc/angular-three)
- [Three.js](https://github.com/mrdoob/three.js/)
- [Angular Material](https://github.com/angular/components) (without styling, just snackbar, tooltip, dialog logic)
- [NGX Mat Queuebar](https://github.com/marcindz88/ngx-mat-queue-bar) my own library based on Angular Material and legacy NGXQueueBar
- [NgRx Component store](https://ngrx.io/guide/component-store) ( state management on game over screen)
- Other Angular libraries


## Local Setup
What are the project requirements/dependencies? Where are they listed? A requirements.txt or a Pipfile.lock file perhaps? Where is it located?

### Prerequisities:

- Windows:
  - Install [nodejs and npm](https://nodejs.org/en/download/)
- Linux:
  - `sudo apt install nodejs`
  - `curl -L https://npmjs.org/install.sh | sudo sh`

### Build and serve
- `npm install` (one time after every change of packages)
- serve the game locally
  - `npm start` connects to local backend
  - `npm run start:remote` connects to the production public jetlag.gg backend api
- open browser on [localhost:4200](http://localhost:4200)


## Room for Improvement
The game is currently stable and provides all and more functionalities than initially planned.
However, there is always a possible to improve the project hence below I list some possible improvements:

- Improve mobile experience
- Improve cockpit layout fuel tank animations and full dashboard experience
- Improve plane death animation - add destruction effect
- Improve texts (aligned with the camera)
- Improve earth loading (lower resolution for less performant devices) and lights, shadows improvements
- Mobile Safari support
- Plane paid improvements (bigger fuel tank, bigger capacity, styling etc.)
- Improve game ending condition and adjust difficulty 

If you would like to contribute to the project, you may propose a solution to some of the above problems and submit the PR, which I will happily verify and include in the project.

## Contact
Created by [@marcindz88](https://github.com/marcindz88) - feel free to contact me!


## License

The project is provided as is and can be used within the bounds of [GPLv3 licence](/LICENSE).

However please do contact us before you fork or copy the project as we would rather have the improvements of any kind implemented within this project, and you are free to submit pull requests with fixes and new features.