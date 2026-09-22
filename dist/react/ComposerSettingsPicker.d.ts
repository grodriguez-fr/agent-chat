import type { ComposerOption } from "../core/index.js";
type Props = {
    models: ComposerOption[];
    selectedModel?: string;
    setModel: (id: string) => void;
    efforts: ComposerOption[];
    selectedEffort?: string;
    setEffort: (id: string) => void;
    disabled: boolean;
    menuSide: "up" | "down";
};
export declare function ComposerSettingsPicker({ models, selectedModel, setModel, efforts, selectedEffort, setEffort, disabled, menuSide }: Props): import("react").JSX.Element | null;
export {};
//# sourceMappingURL=ComposerSettingsPicker.d.ts.map