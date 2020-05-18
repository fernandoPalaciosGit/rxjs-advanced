- https://frontendmasters.com/courses/advanced-async-js/

#### Observables
Es una clase que define un `function suscriptor` como proceso asincrono (http, timeout, websocket)
Define una única interfaz, que es `subscribe()`, donde se pasara por parametro el objeto de observer
El `observer` es un mapa de callback (success, error, complete), asociados a la resolucion del suscriptor

```typescript
class Observable {
    constructor(private suscriptor) {
    }

    subscribe(observer) {
        this.suscriptor(observer);
    }

    static interval(time) {
        return new Observable((observer) => {
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
