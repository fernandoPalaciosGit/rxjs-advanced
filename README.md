- https://frontendmasters.com/courses/advanced-async-js/

#### Observables
Es una clase que define un `function suscriptor` como proceso asincrono (http, timeout, websocket)
Define una única interfaz, que es `subscribe()`, donde se pasara por parametro el objeto de observer
El `observer` es un mapa de callback (success, error, complete), asociados a la resolucion del suscriptor

##### COLD Observable : porque un interval siempre retorna el mismo valor: esperar un tiempo de delay
```typescript
export class Observable {
    constructor(private readonly subscriptor) {
        this.subscriptor = subscriptor;
    }

    subscribe(observer) {
        this.subscriptor(observer);
    }

    static interval(time) {
        return new Observable(function subscriptor (observer) {
            const timer = setInterval(() => {
                observer.next();
                observer.complete();
            }, time);
            return {
                unsubscribe: () => {
                    clearInterval(timer);
                }
            };
        });
    }
}
```

##### HOT Observable : porque encapsula un evento de usuario (no se puede controlar el valor de retorno)
```typescript
export class Observable {
    constructor(private readonly subscriptor) {
        this.subscriptor = subscriptor;
    }

    subscribe(observer) {
        this.subscriptor(observer);
    }

    static fromEvent(domEl: HTMLElement, eventName) {
        return new Observable(function subscriptor(observer) {
            const handler = () => observer.next();
            domEl.addEventListener(eventName, handler);
            return {
                unsubscribe() {
                    domEl.removeEventListener(eventName, handler);
                    observer.complete();
                }
            };
        });
    }
}

const clicks$ = Observable.fromEvent(document.getElementById('#id'), 'click');
clicks$.subscribe(() => console.log('on click fires'));
```

#### Subjects
Por estructura, los observables son instancias que devuelven un closure (la funcion suscriptora), y que expone una unica interfaz que es el subscribe(), en la cual asociamos el observer (suscripcion de eventos).
Entonces la instancia de un observable no tiene ninguna repercusion en el programa hasta que no se ejecute la suscipcion , porque es unicamente la declaracion de un closure.
esto puede provocar sideeffects si no se controla en memoria la cantidad de observables que se acumulan, todo lo contrario a otras API que permiten controlar tambien programas asincronos como la Promise, porque la amisma instancia ejecunjta el programa asincrono (en el mismo hilo de ejecucion que este corriendo), indepèndientemente que asociemos o no una suscripcion de success (then) o fail (catch)
Para evitar estos posibles sideeffects con los obnservables, tenemos los Subjects

hereda de un Observable
Sirva para crear un broadcast de valores
Ejemplo queremos una unica fuente de datos al que se puedan suscribir varios Observables
Es un mecaanismo de multicasting/broadcast a varios observables que se suscriben
Es como un repositorio de multiples observers, y cuando se quiera resolver el valor, se hace push a todos los consumers.

Ejemplos de interfaces en ngrx: `share()`, `replay()`, lo que provocan es que a medida que haya mas suscriptores, todos compartiran la misma fuente del observable a todos los consumers a traves de un efecto bradcast.

```typescript
class Subject extends rxjs.Observable {
    observers = new Set();

    constructor() {
        super(function subscribe(observer) {
            const self = this;
            self.observers.add(observer);

            return {
                unsubscribe() {
                    self.observers.delete(observer);
                }
            };
        });
    }

    next(result) {
        for (const observer of [...this.observers]) {
            observer.next(result);
        }
    }

    error(err) {
        for (const observer of [...this.observers]) {
            observer.error(err);
        }
    }

    complete() {
        for (const observer of [...this.observers]) {
            observer.next();
        }
    }
}
```

##### HOT Observables, COLD Observables
COLD Observables: son observabels estaticos, como los pure pipes (directivas de Angular), simepre que te suscribes, obtienes el mismo resultado.

HOT Observables: dependiendo en el momento en el que te suscribas, se obtendra un dato diferente
por ejemplo cualquier observable de event listeners de acciones de usuario.

##### LAZY EVALUATION
Un Observable puede encadenar varios uscriptores de Observers y no evaluarse hasta que nos suscribimos al final de la cola (hasta que no llamamos al subscribe)


#### MAP --> transform the value to the next subscriptor
```typescript
export class Observable {
    constructor(private readonly subscriptor) {
        this.subscriptor = subscriptor;
    }

    subscribe(observer) {
        this.subscriptor(observer);
    }

    static fromEvent(domEl: HTMLElement, eventName) { /***/ }

    map(iterator) {
        const lastObserver = this;
        return new Observable(function subscriptor(observer) {
            const lastSubscription = lastObserver.subscribe({
                next: (result) => {
                    observer.next(iterator(result));
                },
                error: (err) => {
                    observer.error(err);
                }
            });
            return {
                unsubscribe() {
                    lastSubscription.unsubscribe();
                }
            };
        });
    }
}

Observable.fromEvent(document.getElementById('#id'), 'keypress').map(({keyup}) => keyup)
    .subscribe((keyup) => console.log(`keyboard value: ${keyup}`));
```

#### FILTER --> pass value to next subscriptor if agree the iterator
```typescript
export class Observable {
    constructor(private readonly subscriptor) {
        this.subscriptor = subscriptor;
    }

    subscribe(observer) {
        this.subscriptor(observer);
    }

    static fromEvent(domEl: HTMLElement, eventName) { /***/ }

    filter(iterator) {
        const lastObserver = this;
        return new Observable(function subscriptor(observer) {
            const lastSubscriptor = lastObserver.subscribe({
                next(result){
                    if (iterator(result)) {
                        observer.next(result);
                    }
                }
            });

            return {
                unsubscribe() {
                    lastSubscriptor.unsubscribe();
                }
            }
        });
    }
}

Observable.fromEvent(document.getElementById('#id'), 'keypress')
    .map(({keyup}) => keyup)
    .filter((keyValue) => keyValue > 10)
    .subscribe((keyup) => console.log(`keyboard value: ${keyup}`));
```

##### Concat: se trata secuenciar una lista de observers, respetando los tiemps de ejecucion
```typescript
export class Observable {
    constructor(private readonly subscriptor) {
        this.subscriptor = subscriptor;
    }

    subscribe(observer) {
        this.subscriptor(observer);
    }

    concat(...observables) {
        return new Observable(function subscriptor(observer) {
            const myObservables = [...observables]; // deep copy, to avoid race conditions, if this concat(...observables) execute multiple times
            let mySuscriptor = null;
            const processListObservables = () => {
                if (myObservables.length === 0) {
                    observer.complete();
                } else {
                    let nextObservable = myObservables.shift();
                    const mySuscriptor = nextObservable.subscribe({
                        next(result) {
                            observer.next(result);
                        },
                        error(error) {
                            observer.error(error);
                            mySuscriptor.unsubscribe();
                        },
                        complete() {
                            processListObservables(); // recursive subscriptions
                        }
                    });
                }
            };
            processListObservables(); // subscribe first observable
            return {
                unsubscribe() {
                    mySuscriptor.unsubscribe(); // deprecates last subscription in actual observer iteration
                }
            };
        });
    }
}
```

##### distincUntilChange
procesa los valores del stream dejando pasar solo un valor distinto al anterior
{..1....5..5..45...2..2}.distinctUntilChange() ->
{..1....5.....45...2...}


##### scan
version del Array.prototype.reduce un stream de Observers.
La diferencia es que el valor es acumulado en cada iteracion del stream
[1, 2, 3].reduce((acc, next) => acc + next) === [6]
{...1..2.....3}.scan((acc, next) => acc + next) === {...1..3.....6} 

Se utiliza para trackear la secuencia de valores en el stream

##### merge map
lo mismo que el concatMap pero se resuelve el suscriptor que menos tarde en procesar
 {...2...4}.concat(
 {.1...5}) -->
 {.1...5...2...4} // se respetan los tiempos de resolución de cada suscriptor
 
 {...2...4}.merge(
 {.1...5}) -->
 {.1.2.5.4} // se resuelven a medida que acaban de resolverse


##### switchLatest
se trata de interrumpir la resolucnion de un suscriptor que aun no se ha resuelto si llega un nuevo suscriptor resulto, es decir el primer valor que se resuelve, anula el suscriptor anterior, es un mergeMap pero que cancela la cadena de suscriptores anterior

....{1....5..5}
.......{.1..2.....5...3}
...........{1...9.......9}.switchLatest()
....{1...1..1...9.......9}

Es el operador de Observables que mas se utiliza en entornos graficos, porque es como funciona la interaccion de usuarios, es decir, la ultima accion deroga la anterior
