import * as React from "react";

import { connect, ConnectedReturnType } from "react-redux"; // Custom typings
import { Link } from "react-router-dom";
import { bindActionCreators, Dispatch } from "redux";

import { _captureBackgroundException_ } from "../../lib/errors";
import { setQuoteCurrency } from "../../store/actions/general/generalActions";
import { ApplicationData } from "../../store/types/general";
import { _catch_ } from "../views/ErrorBoundary";

import { currencies, Currency, CurrencyIcon, Dropdown, Header } from "@renex/react-components";

import { ReactComponent as Logo } from "../../styles/images/logo.svg";
import { ReactComponent as English } from "../../styles/images/rp-flag-uk.svg";

const getCurrencyOptions = () => {
    const options = new Map<string, React.ReactNode>();

    for (const currency of currencies) {
        options.set(currency.currency, <>
            <CurrencyIcon currency={currency.currency} />
            {" "}{currency.description}
        </>);
    }

    return options;
};

const currencyOptions = getCurrencyOptions();

const languageOptions = new Map()
    .set("EN",
        <><English /> English</>
    );

const logo = <Link className="no-underline" to="/">
    <Logo />
    <span>beta</span>
</Link>;

/**
 * Header is a visual component providing page branding and navigation.
 */
class HeaderControllerClass extends React.Component<Props, State> {
    public render = (): JSX.Element => {
        const { store: { quoteCurrency } } = this.props;

        const languageDropdown = <Dropdown
            selected={{
                value: "EN",
                render: "English",
            }}
            options={languageOptions}
            setValue={this.setLanguage}
        />;

        const currencyDropdown = <Dropdown
            selected={{
                value: quoteCurrency,
                render: <>
                    <CurrencyIcon currency={quoteCurrency} />
                    {" "}{quoteCurrency.toUpperCase()}
                </>
            }}
            options={currencyOptions}
            setValue={this.setCurrency}
        />;

        return (
            <Header
                logo={logo}
                menu={[
                    languageDropdown, currencyDropdown
                ]}
            />
        );
    }

    private readonly setCurrency = (quoteCurrency: Currency): void => {
        this.props.actions.setQuoteCurrency(quoteCurrency);
    }

    private readonly setLanguage = (language: string): void => {
        // NOT IMPLEMENTED
    }
}

const mapStateToProps = (state: ApplicationData) => ({
    store: {
        quoteCurrency: state.general.quoteCurrency,
    }
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    actions: bindActionCreators({
        setQuoteCurrency,
    }, dispatch)
});

interface Props extends ReturnType<typeof mapStateToProps>, ConnectedReturnType<typeof mapDispatchToProps> {
}

interface State {
}

export const HeaderController = connect(mapStateToProps, mapDispatchToProps)(HeaderControllerClass);
