import { Sidebar } from './components/sidebar';
import { h, render, Fragment, c, d as Part, useState, useRef } from './imports';
import { MonacoEditor } from './components/monaco';

const App = (
  <Part>
    <Sidebar />
    <Part {...c('Editor')}>
      <Part {...c('content')}>
        <MonacoEditor />
      </Part>
    </Part>
  </Part>
);


render(App, document.getElementById('demo'));
