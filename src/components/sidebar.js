import { h, useState, c } from "../imports.js";

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
  <div {...c('search')}>
    <input {...c('searchinput')} type="text" placeholder="Suchen" {...search} />
  </div>
);
export const Sidebar = () => {
  let search = useInputValue();
  return (
    <div {...c('sidebar')} >
      <Searchfield {...search} />
      {search.value}
    </div>
  );
};
