import * as React from "react";

import { connect, ConnectedReturnType } from "react-redux"; // Custom typings
import { bindActionCreators, Dispatch } from "redux";

import { _captureBackgroundException_, _captureInteractionException_ } from "../../lib/errors";
// import { getMarketPrice } from "../lib/market";
import { updatePrices, updateTokenPrices } from "../../store/actions/market/marketActions";
import { ApplicationData } from "../../store/types/general";
import { _catch_ } from "../views/ErrorBoundary";

/**
 * BackgroundTasks is responsible for running background loops like updating
 * balances and prices
 */
class BackgroundTasksClass extends React.Component<Props, State> {

    /**
     * The following timeouts are used to run the various background tasks.
     * setTimeout is used instead of setInterval so the interval between calls
     * includes the time it takes to run the task.
     */
    // tslint:disable: completed-docs
    private callUpdatePricesTimeout: NodeJS.Timer | undefined;
    private callUpdateMarketPricesTimeout: NodeJS.Timer | undefined;
    // tslint:enable: completed-docs

    public constructor(props: Props, context: object) {
        super(props, context);
        this.state = {
        };
    }

    public async componentDidMount(): Promise<void> {
        this.setupLoops();
    }

    public componentWillUnmount() {
        // Clear timeouts
        if (this.callUpdatePricesTimeout) { clearTimeout(this.callUpdatePricesTimeout); }
        if (this.callUpdateMarketPricesTimeout) { clearTimeout(this.callUpdateMarketPricesTimeout); }
    }

    /**
     * The main render function.
     * @dev Should have minimal computation, loops and anonymous functions.
     */
    public render(): React.ReactNode {
        return <></>;
    }

    // Update token prices every 60 seconds
    private readonly callUpdatePrices = async (): Promise<void> => {
        let delay = 60;
        try {
            // tslint:disable-next-line: await-promise
            await this.props.actions.updateTokenPrices();
        } catch (error) {
            _captureBackgroundException_(error, {
                description: "Error thrown in callUpdatePrices background task",
            });
            delay = 5;
        }
        if (this.callUpdatePricesTimeout) { clearTimeout(this.callUpdatePricesTimeout); }
        this.callUpdatePricesTimeout = setTimeout(this.callUpdatePrices, delay * 1000);
    }

    // Retrieve market prices every minute
    private readonly callUpdateMarketPrices = async () => {
        // const { supportedMarkets } = this.props;
        const delay = 60;
        // if (supportedMarkets) {
        //     try {
        //         await Promise.all(supportedMarkets.map(async (pair, marketID) => {
        //             const [price, percentChange] = await getMarketPrice(pair.quote, pair.base);
        //             this.props.actions.updatePrices({ price, percentChange, pair: marketID });
        //         }).toArray());
        //     } catch (error) {
        //         _captureBackgroundException_(error, {
        //             description: "Error in BackgroundTasks.callUpdateMarketPrices",
        //         });
        //         delay = 10;
        //     }
        // } else {
        //     delay = 1;
        // }
        if (this.callUpdateMarketPricesTimeout) { clearTimeout(this.callUpdateMarketPricesTimeout); }
        this.callUpdateMarketPricesTimeout = setTimeout(this.callUpdateMarketPrices, delay * 1000);
    }

    /**
     * setupLoops is called once to start the timeouts
     */
    private readonly setupLoops = () => {
        this.callUpdatePrices().catch(error => {
            _captureBackgroundException_(error, {
                description: "Error in callUpdatePrices in BackgroundTasks",
            });
        });

        this.callUpdateMarketPrices().catch(error => {
            _captureBackgroundException_(error, {
                description: "Error in callUpdatePrices in BackgroundTasks",
            });
        });

    }
}

const mapStateToProps = (state: ApplicationData) => ({
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    actions: bindActionCreators({
        updatePrices,
        updateTokenPrices,
    }, dispatch)
});

interface Props extends ReturnType<typeof mapStateToProps>, ConnectedReturnType<typeof mapDispatchToProps> {
}

interface State {
}

export const BackgroundTasks = connect(mapStateToProps, mapDispatchToProps)(BackgroundTasksClass);
