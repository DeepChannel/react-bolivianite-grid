import * as React from 'react';
export interface IScrollViewUpdateEvent {
    scrollLeft: number;
    scrollTop: number;
    scrollWidth: number;
    scrollHeight: number;
    clientWidth: number;
    clientHeight: number;
}
export interface IScrollViewProps {
    className?: string;
    style?: React.CSSProperties;
    preserveScrollbars?: boolean;
    onScroll: (event: IScrollViewUpdateEvent) => void;
    bodyRenderer: (event: IScrollViewUpdateEvent) => React.ReactNode;
    headersRenderer: (event: IScrollViewUpdateEvent) => React.ReactNode;
}
export interface IScrollViewComponentInterface extends React.Component<IScrollViewProps, any> {
    scrollerStyle: CSSStyleDeclaration;
    scrollLeft: number;
    scrollTop: number;
}
export interface IScrollViewInterface extends React.StaticLifecycle<IScrollViewProps, any> {
    new (props: IScrollViewProps, context?: any): IScrollViewComponentInterface;
    propTypes?: React.ValidationMap<IScrollViewProps>;
    contextTypes?: React.ValidationMap<any>;
    childContextTypes?: React.ValidationMap<any>;
    defaultProps?: Partial<IScrollViewProps>;
    displayName?: string;
}
export declare class ScrollView extends React.Component<IScrollViewProps, any> implements IScrollViewComponentInterface {
    private _r;
    private _taskResize;
    constructor(p: IScrollViewProps, c: any);
    readonly scrollerStyle: CSSStyleDeclaration;
    scrollLeft: number;
    scrollTop: number;
    private _onRef;
    private _onScroll;
    private _getView;
    componentDidMount(): void;
    componentWillUnmount(): void;
    render(): JSX.Element;
}
export default ScrollView;
