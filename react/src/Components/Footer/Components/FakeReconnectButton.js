import React from "react";
import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import { Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";

const CustomizedBtn = styled(Button)(({ theme }) => ({
    "&.footer-icon-button": {
        height: "100%",
        [theme.breakpoints.down("sm")]: {
            padding: 8,
            minWidth: "unset",
            width: "100%",
            "& > svg": {
                width: 36,
            },
        },
    },
}));

function FakeReconnectButton(props) {
    const { t } = useTranslation();

    return (
        <Tooltip title={t("Fake Reconnect")} placement="top">
            <CustomizedBtn
                id="fake-reconnect-button"
                data-testid="fake-reconnect-button"
                onClick={props?.onFakeReconnect}
                variant="contained"
                className={props?.footer ? "footer-icon-button" : ""}
                color="secondary"
            >
                "RC"
            </CustomizedBtn>
        </Tooltip>
    );
}

export default FakeReconnectButton;
