import React from "react";
import { Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";
import {CustomizedBtn} from "../../CustomizedBtn";

function FakeParticipantButton(props) {
    const { t } = useTranslation();

    return (
        <Tooltip
            title={t((props.increment ? "Add" : "Remove") + " Fake Participant")}
            placement="top"
        >
            <CustomizedBtn
                onClick={props?.onAction}
                variant="contained"
                className={props?.footer ? "footer-icon-button" : ""}
                color="secondary"
            >
                {props?.increment ? "+" : "-"}
            </CustomizedBtn>
        </Tooltip>
    );
}

export default FakeParticipantButton;
