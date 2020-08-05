import "./styles.scss";
import { Sidebar } from "./components/sidebar";
import { h, render, Fragment, c, d } from "./imports";

const App = (
  <div>
    <Sidebar></Sidebar>
    <div {...c('Editor')}>
      <div {...c('content')}>Test2</div>
    </div>
  </div>
);

render(App, document.getElementById("demo"));
