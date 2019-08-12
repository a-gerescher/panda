import "./styles.scss";

import { Sidebar } from "./components/sidebar";
import { h, render, Fragment } from "./imports";

const App = () => (
  <Fragment>
    <Sidebar />
    <span>Hello, world6! I beat the bundler</span>
  </Fragment>
);

render(<App />, document.getElementById("demo"));
