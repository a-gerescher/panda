import { h, useState, c, d as Part } from '../imports.js';

const useInputValue = initialValue => {
  const [value, setValue] = useState(initialValue);

  return {
    value,
    onInput: e => {
      setValue(e.target.value || e.target.innerText);
    }
  };
};

const Searchfield = search => (
  <Part {...c('search')}>
    <input {...c('searchinput')} type="text" placeholder="Suchen" {...search} />
  </Part>
);
export const Sidebar = () => {
  let search = useInputValue();
  return (
    <Part {...c('sidebar')} >
      <Searchfield {...search} />
      {search.value}
    </Part>
  );
};
