import{createElement as r}from"./preact.js";export function memo(t,n){function e(r){let t=this.props.ref,e=t==r.ref;return!e&&t&&(t.call?t(null):t.current=null),n?!n(this.props,r)||!e:function(r,t){for(let n in r)if("__source"!==n&&!(n in t))return!0;for(let n in t)if("__source"!==n&&r[n]!==t[n])return!0;return!1}(this.props,r)}function i(n){return this.shouldComponentUpdate=e,r(t,n)}return i.prototype.isReactComponent=!0,i.displayName="Memo("+(t.displayName||t.name)+")",i._forwarded=!0,i}