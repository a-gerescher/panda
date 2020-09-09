
import DefaultEditor, { themes } from './Editor';

import { memo } from '../imports';

const Editor = memo(DefaultEditor);

import ControlledEditor from './ControlledEditor';

import { monaco } from './utils';

export { ControlledEditor, monaco, Editor, themes };