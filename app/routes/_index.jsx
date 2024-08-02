import { useEffect, useRef } from "react";
import { Color, InkBuilder, InputListener } from "digital-ink";
import InkingWebGL from "../.client/ink/InkingWebGL";
import InvisibleInk from "../.client/eraser/InvisibleInk";
import UIMMainThreadSample from "../.client/save/index.jsx";
import Inking2D from "../.client/ink/Inking2D.js";
import * as Y from "yjs"
import { WebrtcProvider } from "y-webrtc"
import { WebsocketProvider } from "y-websocket";

export const meta = () => {
    return [
        { title: "New Remix App" },
        { name: "description", content: "Welcome to Remix!" },
    ];
};



export default function Index() {
    const canvasRef = useRef(null);
    const inkController = useRef(null);
    const ydoc = new Y.Doc()
    const ymap = ydoc.getMap("map")
    ymap.observe(event => {
        let newSensorPoint = {}
        switch (ymap.get("sensor").phase.name) {
            case "BEGIN":
                console.log("BEGIN")
                console.log(ymap.get('sensor'))
                newSensorPoint = {
                    ...ymap.get("sensor"),
                    phase: InkBuilder.Phase.BEGIN
                  }
                inkController.current.registerInputProvider(1, true)
                inkController.current.begin(newSensorPoint)
                break
            case "UPDATE":
                console.log("UPDATE")
                newSensorPoint = {
                    ...ymap.get("sensor"),
                    phase: InkBuilder.Phase.UPDATE
                  }
                inkController.current.move(newSensorPoint)
                break
            case "END":
                console.log("END")
                newSensorPoint = {
                    ...ymap.get("sensor"),
                    phase: InkBuilder.Phase.END
                  }
                inkController.current.end(newSensorPoint)
                break
            default:
                break
        }
    })

    useEffect(() => {
        window.ymap = ymap
        const provider = new WebrtcProvider("remix-ink", ydoc)

        inkController.current = new UIMMainThreadSample(canvasRef.current);
        inkController.current.init();
        window.builder = inkController.current.builder
        InputListener.attach(inkController.current);
        // InputListener.disable()
        // for debug
        window.inkController = inkController
        window.inputListener = InputListener
        return () => {
            InputListener.detach(inkController.current);
            provider.destroy()
        }
    }, []);

    const clearCanvas = () => {
        if (!inkController.current) return;
        inkController.current.clear();
    };

    const setEraser = () => {
        const tool = "app://ink-samples/toolkit/PartialStrokeEraser";
        inkController.current.tool = tool;
    };

    const setPencil = () => {
        const tool = "app://ink-samples/toolkit/Pen";
        inkController.current.tool = tool;
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            inkController.current.actions.decode(event.target.result);
        };
        reader.readAsArrayBuffer(file);
    };

    const handleFileSave = () => {
        inkController.current.actions.encode().then((buffer) => {
            const blob = new Blob([buffer], {
                type: "application/octet-stream",
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "drawing.uim");
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        });
    };

    const pointerDown = (e) => {
        e.preventDefault()
        const sensorPoint = window.inputListener.createSensorPoint(e.nativeEvent)
        ymap.set("sensor", sensorPoint)
    }

    const pointerMove = (e) => {
        if (e.buttons !== 1) return
        e.preventDefault()
        const sensorPoint = window.inputListener.createSensorPoint(e.nativeEvent)
        ymap.set("sensor", sensorPoint)
    }

    const pointerUp = (e) => {
        e.preventDefault()
        const sensorPoint = window.inputListener.createSensorPoint(e.nativeEvent)
        ymap.set("sensor", sensorPoint)
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="w-full max-w-3xl bg-white rounded-lg shadow-lg p-6">
                <div className="flex flex-wrap justify-between mb-4 gap-2">
                    <button
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200 flex items-center"
                        onClick={setPencil}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-2"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                        鉛筆
                    </button>
                    <button
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition duration-200 flex items-center"
                        onClick={setEraser}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-2"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                                clipRule="evenodd"
                            />
                        </svg>
                        消しゴム
                    </button>
                    <button
                        className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition duration-200 flex items-center"
                        onClick={clearCanvas}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-2"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                clipRule="evenodd"
                            />
                        </svg>
                        クリア
                    </button>
                    <label className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition duration-200 flex items-center cursor-pointer">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-2"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
                                clipRule="evenodd"
                            />
                        </svg>
                        開く (.uim)
                        <input
                            type="file"
                            accept=".uim"
                            className="hidden"
                            onChange={handleFileUpload}
                        />
                    </label>
                    <button
                        className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition duration-200 flex items-center"
                        onClick={handleFileSave}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-2"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
                                clipRule="evenodd"
                            />
                        </svg>
                        保存 (.uim)
                    </button>
                </div>
                <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
                    <canvas
                        id="canvas"
                        ref={canvasRef}
                        width="800"
                        height="600"
                        onPointerDown={pointerDown}
                        onPointerMove={pointerMove}
                        onPointerUp={pointerUp}
                    ></canvas>
                </div>
            </div>
        </div>
    );
}
