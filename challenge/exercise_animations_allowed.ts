/*
- representamos a traves de TASKS recursos de la aplicacion que se deben priorizar
- el objetivo es crear un stream de flags (true, false) que indiquen a las animaciones cuando pueden realizarse
- desde [false] (se ejecutan las tareas prioritarias) ---> [true] (finalizan las tareas) , las animaciones deben detenerse
*/
/*
const priorityTasks$ = {
    .........{.....5....2...3..}
    ..............{5....4...........3}
    ...........................................{5....2....4}
    .................................................{........5}
};
const animationsAllowed$ = {
    .....false....................true.....false........true
}
*/
import { of } from 'rxjs';

let isAllowAnimations = false; // use globally for Animations Components
const animationsAllowed$ = of(false);

animationsAllowed$.subscribe((flag) => isAllowAnimations = flag)
