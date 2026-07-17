import { IInputs, IOutputs } from "./generated/ManifestTypes";
import { ChecklistApp, ChecklistAppProps } from "./components/ChecklistApp";
import { readFieldNames } from "./components/types";
import * as React from "react";

export class InspectionChecklist implements ComponentFramework.ReactControl<IInputs, IOutputs> {
    private notifyOutputChanged: () => void;

    constructor() {
        // Empty
    }

    public init(
        context: ComponentFramework.Context<IInputs>,
        notifyOutputChanged: () => void,
        state: ComponentFramework.Dictionary
    ): void {
        this.notifyOutputChanged = notifyOutputChanged;
        context.mode.trackContainerResize(true);
    }

    public updateView(context: ComponentFramework.Context<IInputs>): React.ReactElement {
        const props: ChecklistAppProps = {
            context,
            fields: readFieldNames(context),
        };
        return React.createElement(ChecklistApp, props);
    }

    public getOutputs(): IOutputs {
        return {};
    }

    public destroy(): void {
        // Add code to cleanup control if necessary
    }
}
