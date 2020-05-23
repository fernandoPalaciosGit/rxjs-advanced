const { of, fromEvent, merge } = rxjs;
const { switchMap, tap, map, scan } = rxjs.operators;
const { fromFetch } = rxjs.fetch;
const nextButton = document.getElementById('next');
const backButton = document.getElementById('back');
const subSelect = document.getElementById('sub');
const img = document.getElementById('img');
const loading = document.getElementById('loading');

const LOADING_ERROR_URL = 'https://jhusain.github.io/reddit-image-viewer/error.png';

// function which returns an array of image URLs for a given reddit sub
function getSubImages(sub) {
    const cachedImages = localStorage.getItem(sub);
    if (cachedImages) {
        return of(JSON.parse(cachedImages));
    } else {
        const url = `https://www.reddit.com/r/${sub}/.json?limit=200&show=all`;

        return fromFetch(url).pipe(
            switchMap((response) => response.json()),
            map((data) => data.data.children.map(image => image.data.url)),
            tap((images) => localStorage.setItem(sub, JSON.stringify(images)))
        );
    }
}

// ---------------------- INSERT CODE  HERE ---------------------------
const stubSelection$ = merge(
    of(subSelect.value), // stub has an init selected even we do not select any one with the control
    fromEvent(subSelect, 'change').pipe(map(({ currentTarget }) => currentTarget.value))
);
const backImagesSelection$ = fromEvent(backButton, 'click');
const forwardImagesSelection$ = fromEvent(nextButton, 'click');
// This "images" Observable is a dummy. Replace it with a stream of each
// image in the current sub which is navigated by the user.

const offsets$ = merge(
    backImagesSelection$.pipe(map(() => -1)),
    forwardImagesSelection$.pipe(map(() => 1))
);

const imageIndex$ = merge(
    of(0), // initialize thhe index (sino selectImages$ NO emitiré imagen seleccionada añ principio, sin seleccionar un next/forward)
    offsets$.pipe(scan((acc, next) => acc + next, 0))
);

const selectImages$ = stubSelection$.pipe(
    switchMap((stub) => getSubImages(stub)),
    switchMap((images) => {
        return imageIndex$.pipe(map((index) => images[index]));
    })
);

selectImages$.subscribe({
    next(url) {
        // hide the loading image
        loading.style.visibility = 'hidden';

        // set Image source to URL
        img.src = url;
    },
    error() {
        alert('I\'m having trouble loading the images for that sub. Please wait a while, reload, and then try again later.');
    }
});

// This "actions" Observable is a placeholder. Replace it with an
// observable that notifies whenever a user performs an action,
// like changing the sub or navigating the images
const actions$ = merge(
    stubSelection$,
    backImagesSelection$,
    forwardImagesSelection$
);

actions$.subscribe(() => loading.style.visibility = 'visible');
