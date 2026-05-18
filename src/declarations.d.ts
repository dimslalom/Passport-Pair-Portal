declare module 'react-simple-maps' {
  import type { ReactNode, CSSProperties, MouseEvent } from 'react';

  interface RSMGeo {
    rsmKey: string;
    properties: Record<string, string>;
    [key: string]: unknown;
  }

  interface GeoStyle {
    outline?: string;
    opacity?: number;
    fill?: string;
    stroke?: string;
  }

  export function ComposableMap(props: {
    projection?: unknown;
    projectionConfig?: Record<string, unknown>;
    width?: number;
    height?: number;
    style?: CSSProperties;
    className?: string;
    children?: ReactNode;
  }): JSX.Element;

  export function Geographies(props: {
    geography: string;
    children: (data: { geographies: RSMGeo[] }) => ReactNode;
  }): JSX.Element;

  export function Geography(props: {
    geography: RSMGeo;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    style?: { default?: GeoStyle; hover?: GeoStyle; pressed?: GeoStyle };
    onMouseEnter?: (event: MouseEvent<SVGPathElement>) => void;
    onMouseMove?: (event: MouseEvent<SVGPathElement>) => void;
    onMouseLeave?: (event: MouseEvent<SVGPathElement>) => void;
    className?: string;
  }): JSX.Element;
}

declare module 'd3-geo-projection' {
  import type { GeoProjection } from 'd3-geo';
  export function geoRobinson(): GeoProjection;
  export function geoNaturalEarth2(): GeoProjection;
}
