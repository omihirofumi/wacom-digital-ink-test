import {InkController, InkBuilder, PathPointContext, InkCanvas2D, StrokeRenderer2D, StrokeRendererGL, BlendMode, Color} from "digital-ink"

import repository from "./DataRepository"

/*
InkBuilder: geometry pipelineを構築するためのクラス
	geometry pipeline: オブジェクトの数学的表現（頂点、エッジ、面）を取得し、一連変換を適用して画面上のピクセルに変換
# 入力
	* Position: (x, y)
	* Phase: 入力の段階（BEGIN, UPDATE, END）
	* Timestamp: 入力のタイムスタンプ、速度の計算に使用
	* その他（Force, Radius, Altitude Angle, Azimnuth Angle)

# 内部表現とモデル
	* ポインタデータ: 上記入力の形式での入力
	* PathPoint: 点の内部表現
	* Path: PathPointの平面上の集合
	* Layout: それぞれのパスポイントの項目の記述子
	* Spline: スプライン


*/


class BasicInkController extends InkController {
	#context = new PathPointContext();

	constructor(inkCanvas) {
		super();

		const StrokeRenderer = (inkCanvas instanceof InkCanvas2D) ? StrokeRenderer2D : StrokeRendererGL;

		this.canvas = inkCanvas;
		this.strokesLayer = inkCanvas.createLayer();

		this.strokeRenderer = new StrokeRenderer(this.canvas);

		this.builder = new InkBuilder();
		this.builder.onComplete = this.draw.bind(this);

		this.color = new Color(204, 204, 204);
	}

	init() {}

	registerInputProvider(pointerID, isPrimary) {
		console.log("registerInputProvider", pointerID, isPrimary)
		if (Array.isArray(pointerID)) {
			// multi-touch should handle all changedTouches and to assign builders for each other
			if (isNaN(this.builder.pointerID))
				this.builder.pointerID = pointerID.first;
		}
		else {
			if (isPrimary)
				this.builder.pointerID = pointerID;
		}
	}

	getInkBuilder(pointerID) {
		console.log("getInkBuilder")
		if (Array.isArray(pointerID)) {
			if (pointerID.length > 0 && !pointerID.includes(this.builder.pointerID)) return undefined;
			return this.builder;
		}
		else
			return (this.builder.pointerID == pointerID) ? this.builder : undefined;
	}

	reset(sensorPoint) {
		console.log("reset")
		console.log(">>")
		let ibo = this.buildInkBuilderOptions(sensorPoint);
		console.log(">>")
		let sro = this.buildStrokeRendererOptions();

		this.builder.configure(ibo);
		this.strokeRenderer.configure(sro);
	}

	// ペンの設定、色等の設定をここで行う
	buildInkBuilderOptions(sample) {
		console.log("buildInkBuilderOptions")
		let tool = repository.get(this.tool);
		let brush = repository.get(tool.brush);

		this.#context.reset(sample, brush, this.color, tool.dynamics, tool.statics);

		return {
			brush,
			layout: this.#context.layout,
			pathPointCalculator: this.#context.calculate.bind(this.#context),
			pathPointProps: this.#context.statics
		};
	}

	buildStrokeRendererOptions() {
		console.log("buildStrokeRendererOptions")
		let tool = repository.get(this.tool);

		return {
			brush: repository.get(tool.brush),
			color: this.#context.color || this.color,
			blendMode: tool.blendMode || BlendMode.SOURCE_OVER
		};
	}

	begin(sensorPoint) {
		console.log("begin")
		console.log(">>")
		this.reset(sensorPoint);

		this.builder.add(sensorPoint);
		this.builder.build();
	}

	move(sensorPoint) {
		console.log("move")
		this.builder.add(sensorPoint);

		if (!this.requested) {
			this.requested = true;

			this.builder.build();

			requestAnimationFrame(() => (this.requested = false));
		}
	}

	end(sensorPoint) {
		console.log("end")
		this.builder.add(sensorPoint);
		this.builder.build();
	}

	draw(pathPart) {
		console.log("draw")
		this.strokeRenderer.draw(pathPart.added, pathPart.phase == InkBuilder.Phase.END);

		if (pathPart.phase == InkBuilder.Phase.UPDATE) {
			this.strokeRenderer.drawPreliminary(pathPart.predicted);

			let dirtyArea = this.canvas.bounds.intersect(this.strokeRenderer.updatedArea);

			if (dirtyArea)
				console.log(">>")
				this.present(dirtyArea, pathPart.phase);
		}
		else if (pathPart.phase == InkBuilder.Phase.END) {
			let affectedArea = this.strokeRenderer.strokeBounds.union(this.strokeRenderer.updatedArea);
			let dirtyArea = this.canvas.bounds.intersect(affectedArea);

			if (dirtyArea)
				console.log(">>")
				this.present(dirtyArea, pathPart.phase);
		}
	}

	present(dirtyArea, phase) {
		console.log("present")
		if (phase == InkBuilder.Phase.END)
			this.strokeRenderer.blendStroke(this.strokesLayer);

		this.canvas.clear(dirtyArea);
		this.canvas.blend(this.strokesLayer, {rect: dirtyArea});

		if (phase == InkBuilder.Phase.UPDATE)
			this.strokeRenderer.blendUpdatedArea();
	}

	abort() {
		console.log("abort")
		if (!this.builder.phase) return;

		let dirtyArea = this.strokeRenderer.affectedArea;

		this.strokeRenderer.abort();
		this.builder.abort();

		if (dirtyArea)
			console.log(">>")
			this.refresh(dirtyArea);
	}

	refresh(dirtyArea = this.canvas.bounds) {
		console.log("refresh")
		this.canvas.clear(dirtyArea);
		this.canvas.blend(this.strokesLayer, {rect: dirtyArea});
	}

	clear() {
		console.log("clear")
		this.strokesLayer.clear();
		this.canvas.clear();
	}
}

export default BasicInkController
