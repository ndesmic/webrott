import { renderIndexedBitmap, renderTiledMap } from "../lib/image-utils.js";

function renderTedMap(map, walls, pallet){
	const renderedWalls = walls.map(w => renderIndexedBitmap(w, pallet, true));
	return renderTiledMap(map, renderedWalls, 64);
}

self.onmessage = e => {
	switch(e.data.functionName){
		case "renderIndexedBitmap": {
			const indexedBitmap = renderIndexedBitmap(e.data.args[0], e.data.args[1], true).transferToImageBitmap();
			self.postMessage({
				name: "result",
				id: e.data.id,
				result: indexedBitmap
			}, [indexedBitmap]);
			break;
		}
		case "renderTedMap": {
			const map = renderTedMap(...e.data.args).transferToImageBitmap();
			self.postMessage({
				name: "result",
				id: e.data.id,
				result: map
			}, [map]);
			break;
		}
	}
};