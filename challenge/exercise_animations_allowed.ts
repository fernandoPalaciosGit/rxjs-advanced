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
import { catchError, distinctUntilChanged, filter, map, mergeMap, scan } from 'rxjs/operators';
import { concat, empty, of } from 'rxjs';
import { webSocket } from 'rxjs/webSocket';

let isAllowAnimations = false; // use globally for Animations Components
const priorityTasks$ = webSocket<number>('https://sync_to_server');
const animationsAllowed$ = priorityTasks$.pipe(
    mergeMap((result) =>
        concat(
            of(1), // marcamos el nuevo stream con un flag --> la tarea empieza
            filter(() => false), // eliminamos los resultados del stream --> stream vacio
            of(-1) // la tarea acaba
        )
    ),
    catchError(() => empty()),
    scan((acc, curr: number) => acc + curr, 0),
    map((val) => val === 0),
    distinctUntilChanged()
);
animationsAllowed$.subscribe((flag) => isAllowAnimations = flag);
