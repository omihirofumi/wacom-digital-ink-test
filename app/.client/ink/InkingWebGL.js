import { Color, InkCanvasGL } from "digital-ink";

import repository from "../DataRepository"
import BasicInkController from "../BasicInkController";

class InkingWebGL extends BasicInkController {
    tool = "app://ink-samples/toolkit/Pencil"

    constructor(canvas) {
        super(InkCanvasGL.createInstance(canvas))
        this.color = new Color(255, 0, 0)
    }

    async init() {
        let tool = repository.get(this.tool)
        let brush = repository.get(tool.brush)

        await brush.configure(this.canvas.ctx)
    }
}

export default InkingWebGL
