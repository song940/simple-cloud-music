import App from './App.svelte';

const rootElement = document.documentElement;
const clientWidth = rootElement.clientWidth;
const vM = 750;
const vFontSize = 100;

rootElement.style.fontSize = (vFontSize * clientWidth) / vM + 'px';
localStorage.setItem('fullWidth', clientWidth);

const app = new App({
  target: document.body,
  props: {
    name: 'world',
  },
});

export default app;
