const { of, fromEvent, merge } = rxjs;
const { switchMap, tap } = rxjs.operators;
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
            tap((images) => localStorage.setItem(sub, JSON.stringify(images)))
        );
    }
}

// ---------------------- INSERT CODE  HERE ---------------------------
const stubSelection$ = fromEvent(subSelect, 'change').pipe(
    switchMap(({ currentTarget }) => getSubImages(currentTarget.value))
);
const backImagesSelection$ = fromEvent(backButton, 'click');
const forwardImagesSelection$ = fromEvent(nextButton, 'click');
// This "images" Observable is a dummy. Replace it with a stream of each
// image in the current sub which is navigated by the user.
const images = of('https://upload.wikimedia.org/wikipedia/commons/3/36/Hopetoun_falls.jpg');

images.subscribe({
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
const actions = merge(
    stubSelection$,
    backImagesSelection$,
    forwardImagesSelection$
);

actions.subscribe(() => loading.style.visibility = 'visible');