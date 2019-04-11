import * as React from "react";

import { connect, ConnectedReturnType } from "react-redux"; // Custom typings
import { Router, withRouter } from "react-router-dom";
import { bindActionCreators, Dispatch } from "redux";

import { FeedbackButton, ScrollToTop as ScrollToTopWithoutRouter } from "@renex/react-components";

import { _captureBackgroundException_ } from "../../lib/util/errors";
import { history } from "../../lib/util/history";
import { ApplicationData } from "../../store/types/general";
import { _catch_ } from "../views/ErrorBoundary";
import { BackgroundTasks } from "./BackgroundTasks";
import { HeaderController } from "./HeaderController";
import { SwapController } from "./SwapController";

const ScrollToTop = withRouter(ScrollToTopWithoutRouter);

/**
 * App is the main visual component responsible for displaying different routes
 * and running background app loops
 */
class AppClass extends React.Component<Props, State> {
    /**
     * The main render function.
     * @dev Should have minimal computation, loops and anonymous functions.
     */
    public render(): React.ReactNode {
        return (
            <Router history={history}>
                <main className="theme-light">
                    <div className="themed-app">
                        {_catch_(<BackgroundTasks />)}
                        <ScrollToTop />

                        <div>
                            {_catch_(<HeaderController />)}
                            {_catch_(<SwapController />)}
                            {_catch_(<FeedbackButton url="#" />)}
                        </div>
                    </div>
                </main>
            </Router>
        );
    }
}

const mapStateToProps = (state: ApplicationData) => ({
    store: {
    }
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    actions: bindActionCreators({
    }, dispatch)
});

interface Props extends ReturnType<typeof mapStateToProps>, ConnectedReturnType<typeof mapDispatchToProps> {
}

interface State {
}

export const App = connect(mapStateToProps, mapDispatchToProps)(AppClass);
