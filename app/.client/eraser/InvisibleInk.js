import { InkCanvas2D } from "digital-ink";
import BasicInkController from "../BasicInkController";

class InvisibleInk extends BasicInkController {
    tool = "app://ink-samples/toolkit/PartialStrokeEraser"

    constructor(canvas) {
        super(InkCanvas2D.createInstance(canvas))
    }
}

export default InvisibleInk
