// jsdom doesn't implement `visualViewport`, which Vuetify's overlay
// positioning (used by v-dialog, v-menu, v-autocomplete, etc.) reads for
// layout calculations. A minimal stub is enough for component tests.
if (!window.visualViewport) {
  Object.defineProperty(window, 'visualViewport', {
    writable: true,
    value: {
      width: window.innerWidth,
      height: window.innerHeight,
      scale: 1,
      offsetLeft: 0,
      offsetTop: 0,
      pageLeft: 0,
      pageTop: 0,
      onresize: null,
      onscroll: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    },
  })
}
