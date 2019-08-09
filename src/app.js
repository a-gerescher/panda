import './styles.scss';

const { h, render } = window.preact;

const App = () => {
  return (
    <div>
      <span>Hello, world6! I beat the bundler</span>
    </div>
  );
};

render(<App />, document.getElementById("demo"));
