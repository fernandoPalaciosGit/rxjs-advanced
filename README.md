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

Observable.fromEvent($dom, 'click')
    .subscribe(() => console.log('launch event listener'));
```

#### Subjects
Por estructura, los observables son instancias que devuelven un closure (la funcion suscriptora), y que expone una unica interfaz que es el subscribe(), en la cual asociamos el observer (suscripcion de eventos).
Entonces la instancia de un observable no tiene ninguna repercusion en el programa hasta que no se ejecute la suscipcion , porque es unicamente la declaracion de un closure.
esto puede provocar sideeffects si no se controla en memoria la cantidad de observables que se acumulan, todo lo contrario a otras API que permiten controlar tambien programas asincronos como la Promise, porque la amisma instancia ejecunjta el programa asincrono (en el mismo hilo de ejecucion que este corriendo), indepèndientemente que asociemos o no una suscripcion de success (then) o fail (catch)
Para evitar estos posibles sideeffects con los obnservables, tenemos los Subjects

##### HOT Observables, COLD Observables
COLD Observables: son observabels estaticos, como los pure pipes (directivas de Angular), simepre que te suscribes, obtienes el mismo resultado.

HOT Observables: dependiendo en el momento en el que te suscribas, se obtendra un dato diferente
por ejemplo cualquier observable de event listeners de acciones de usuario.

##### LAZY EVALUATION
Un Observable puede encadenar varios uscriptores de Observers y no evaluarse hasta que nos suscribimos al final de la cola (hasta que no llamamos al subscribe)
