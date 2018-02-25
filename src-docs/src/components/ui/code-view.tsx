import * as React from 'react';
import * as classnames from 'classnames';
import Code from 'react-syntax-highlighter';
import { SplitView, ScrollView } from './index';
const CodeTheme = require('react-syntax-highlighter/styles/hljs/obsidian');
const Style = require('./code-view.scss');

const CODE_STYLE_PROPS: React.CSSProperties = {
    margin: 0,
    boxSizing: 'border-box',
    overflowY: 'visible',
    overflowX: 'visible',
    display: 'inline-block',
    background: 'transparent'
};

export type ICodeViewFile = (
    string | string[]
);

export interface ICodeViewProps {
    height?: number;
    files: ICodeViewFile[];
    example: string;
}

export interface ICodeViewElementProps {
    className?: string;
}

export class CodeView extends React.PureComponent<ICodeViewProps & ICodeViewElementProps, any> {
    state = {
        tab: 0
    };

    private _extractFile(file: ICodeViewFile) {
        let filename = '';
        let language = 'javascript';
        let caption = '';

        if (typeof file === 'string') {
            filename = file;
            caption = file;
        } else {
            filename = file[0];
            language = file[1] || language;
            caption = file[2] || filename;
        }

        return { filename, language, caption };
    }

    private _renderFileContent() {
        let file = (this.props.files || [])[this.state.tab];

        if (!file) {
            return null;
        }

        const { filename, language } = this._extractFile(file);

        const content = require('!raw-loader!~Content/' + filename);

        return (
            <Code
                showLineNumbers
                language={language}
                style={CodeTheme.default}
                customStyle={CODE_STYLE_PROPS}
            >
                {content || ''}
            </Code>
        );
    }

    private _renderArticle() {
        const content = require('~Content/' + this.props.example);
        const D = content && content.default;

        if (!D) {
            return null;
        }

        return <D />;
    }

    private _renderTabs() {
        if (!this.props.files) {
            return null;
        }

        return this.props.files.map((file, tab) => {
            const { caption } = this._extractFile(file);

            return (
                <button
                    key={tab}
                    className={classnames(Style.tab, {
                        [Style.tabSelected]: tab === this.state.tab
                    })}
                    onClick={() => {
                        this.setState({ tab });
                    }}
                >
                    {caption}
                </button>
            );
        });
    }

    public render() {
        return (
            <div
                className={classnames(Style.root, this.props.className)}
                style={{
                    maxHeight: this.props.height
                }}
            >
                <div className={Style.controls}>
                    {this._renderTabs()}
                </div>
                <SplitView>
                    <ScrollView className={Style.container} lock={null}>
                        {this._renderFileContent()}
                    </ScrollView>
                    <div className={Style.container}>
                        {this._renderArticle()}
                    </div>
                </SplitView>
            </div>
        );
    }
}
