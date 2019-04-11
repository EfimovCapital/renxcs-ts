import * as Sentry from "@sentry/browser";
import * as React from "react";

import { _captureComponentException_ } from "../../lib/util/errors";

class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { error: null, errorInfo: null };
    }

    public componentDidCatch = (error: Error, errorInfo: React.ErrorInfo) => {
        this.setState({
            error,
            errorInfo,
        });
        _captureComponentException_(error, errorInfo);
    }

    /**
     * The main render function.
     * @dev Should have minimal computation, loops and anonymous functions.
     */
    public render(): React.ReactNode {
        if (this.state.errorInfo) {
            // Error path
            return (
                <div>
                    <h2>Something went wrong.</h2>
                    <details style={{ whiteSpace: "pre-wrap" }}>
                        <p role="button" style={{ cursor: "pointer" }} onClick={this.reportFeedback}>
                            Click to report feedback
                        </p>
                        {this.state.error && this.state.error.toString()}
                        <br />
                        {this.state.errorInfo.componentStack}
                    </details>
                </div>
            );
        }
        // Normally, just render children
        return this.props.children;
    }

    private readonly reportFeedback = () => {
        Sentry.showReportDialog();
    }
}

interface Props {
}

interface State {
    error: null | Error;
    errorInfo: null | React.ErrorInfo;
}

export const _catch_ = (
    children: React.ReactNode,
) => <ErrorBoundary>
        {children}
    </ErrorBoundary>;
