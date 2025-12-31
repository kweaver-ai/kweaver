/// <reference types="@rsbuild/core/types" />
declare module '@aishu-tech/components/dist/dip-components.min.js';

// SVG module declarations for SVGR
declare module '*.svg' {
  import React = require('react');

  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  const content: any;
  export default content;
}
