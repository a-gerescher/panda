import { h } from '../imports';
const loadingStyles = {
  display: 'flex',
  height: '100%',
  width: '100%',
  justifyContent: 'center',
  alignItems: 'center'
};

function Loading({ content }) {
  return (
    <div style={loadingStyles}>{content}</div>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    position: 'relative',
    textAlign: 'initial'
  },
  fullWidth: {
    width: '100%'
  },
  hide: {
    display: 'none'
  }
};

// ** forwardref render functions do not support proptypes or defaultprops **
// one of the reasons why we use a separate prop for passing ref instead of using forwardref

const MonacoContainer = ({
  width,
  height,
  isEditorReady,
  loading,
  _ref,
  className,
  wrapperProps,
}) => {
  return (
    <section style={{ ...styles.wrapper, width, height }} {...wrapperProps}>
      {!isEditorReady && <Loading content={loading} />}
      <div
        ref={_ref}
        style={{ ...styles.fullWidth, ...(!isEditorReady && styles.hide) }}
        className={className}
      />
    </section>
  );
}


export default MonacoContainer;