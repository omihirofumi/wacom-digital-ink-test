import {InkCodec, BrushGL} from "digital-ink"

import InkModelSample from "./InkModelSample";

class UIMMainThreadSample extends InkModelSample {
	constructor(canvas) {
		super(canvas);

		this.codec = new InkCodec();

		this.actions = {
			decode: this.decode.bind(this),
			encode: this.encode.bind(this)
		};
	}

	// processing the pipeline on main thread is not recommended
	// for bigger files main thread could be blocked for awhile and UX will be affected
	// it is recommended to configure web workers or wasm for non-blocking behaviour
	pipeline(strokes) {
		for (let stroke of strokes)
			stroke.buildPath();
	}

	async decode(buffer) {
		this.clear(true);

		let inkModel = await this.codec.decodeInkModel(buffer);

		if (inkModel.brushes.find(brush => brush instanceof BrushGL)) {
			alert("Current sample targets vector content only, raster content found");
			return;
		}

		await this.pipeline(inkModel.strokes);

		this.inkModel = inkModel;

		this.redraw();
	}

	async encode() {
		let buffer = await this.codec.encodeInkModel(this.inkModel);

		return buffer;
	}

	static renderActionBar() {
		return (
		  <div className="action-bar">
			<label htmlFor="open-uim-file">
			  <span>Open (.uim)</span>
			  <input
				type="file"
				id="open-uim-file"
				accept=".uim"
				onChange={(e) => {
				  const file = e.target.files[0];
				  const reader = new FileReader();
				  reader.onload = (event) => {
					this.actions.decode(event.target.result);
				  };
				  reader.readAsArrayBuffer(file);
				}}
			  />
			</label>
	
			<a
			  href="javascript:void(0)"
			  onClick={() => {
				this.actions.encode().then((buffer) => {
				  const blob = new Blob([buffer], { type: 'application/octet-stream' });
				  const url = URL.createObjectURL(blob);
				  const link = document.createElement('a');
				  link.href = url;
				  link.setAttribute('download', 'ink.uim');
				  document.body.appendChild(link);
				  link.click();
				  link.remove();
				});
			  }}
			>
			  Save (.uim)
			</a>
		  </div>
		);
	}
}

UIMMainThreadSample.settings = {
	section: "Ink Model and Serialization",
	title: "Import / Export UIM files on the Main Thread"
};

export default UIMMainThreadSample
