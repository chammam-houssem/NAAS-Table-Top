import { render, jsx } from './utils/mini-react.js';
import App from './app/App.js';
import './styles/global.css';

const root = document.getElementById('root');
if (root) {
  render(jsx(App, {}), root as HTMLElement);
}
